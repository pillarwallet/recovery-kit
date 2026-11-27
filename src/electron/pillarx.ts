import {
  concat,
  encodeAbiParameters,
  encodeFunctionData,
  pad,
  parseAbi,
  parseEventLogs,
  toHex,
  zeroAddress,
  zeroHash,
} from "viem";
import type { Account, Chain, PublicClient, Transport, WalletClient } from "viem";
import {
  entryPoint07Abi,
  entryPoint07Address,
  getUserOperationHash,
  toPackedUserOperation,
} from "viem/account-abstraction";
import type { UserOperation } from "viem/account-abstraction";

/**
 * PillarX accounts are Etherspot Modular accounts (ERC-7579 on ERC-4337
 * EntryPoint v0.7), created by @etherspot/modular-sdk with its defaults:
 * account index 0 and a single MultipleOwnerECDSAValidator.
 *
 * These contracts are deployed at the same address on every chain PillarX
 * supports.
 */
export const PILLARX_WALLET_FACTORY_ADDRESS =
  "0x38CC0EDdD3a944CA17981e0A19470d2298B8d43a";
export const PILLARX_BOOTSTRAP_ADDRESS =
  "0xCF2808eA7d131d96E5C73Eb0eCD8Dc84D33905C7";
export const PILLARX_ECDSA_VALIDATOR_ADDRESS =
  "0x0eA25BF9F313344d422B513e1af679484338518E";

const factoryAbi = parseAbi([
  "function createAccount(bytes32 salt, bytes initCode) returns (address)",
  "function getAddress(bytes32 salt, bytes initcode) view returns (address)",
]);

const bootstrapAbi = parseAbi([
  "struct BootstrapConfig { address module; bytes data; }",
  "function initMSA(BootstrapConfig[] validators, BootstrapConfig[] executors, BootstrapConfig hook, BootstrapConfig[] fallbacks)",
]);

const moduleAbi = parseAbi(["function onInstall(bytes data)"]);

const accountAbi = parseAbi([
  "function execute(bytes32 mode, bytes executionCalldata)",
]);

// ERC-7579 execution mode: single call, revert on failure
const SINGLE_EXECUTION_MODE = zeroHash;

// The account is created inside the UserOperation when it has no code yet
const VERIFICATION_GAS_LIMIT = 300_000n;
const VERIFICATION_GAS_LIMIT_WITH_DEPLOYMENT = 1_500_000n;

export type PillarXCall = {
  to: `0x${string}`;
  value: bigint;
  data: `0x${string}`;
};

type SignerWallet = WalletClient<Transport, Chain, Account>;

const getInitData = (owner: `0x${string}`): `0x${string}` => {
  const onInstall = encodeFunctionData({
    abi: moduleAbi,
    functionName: "onInstall",
    args: ["0x"],
  });

  const noModule = { module: zeroAddress, data: onInstall };

  const initMSA = encodeFunctionData({
    abi: bootstrapAbi,
    functionName: "initMSA",
    args: [
      [{ module: PILLARX_ECDSA_VALIDATOR_ADDRESS, data: onInstall }],
      [noModule],
      noModule,
      [noModule],
    ],
  });

  return encodeAbiParameters(
    [{ type: "address" }, { type: "address" }, { type: "bytes" }],
    [owner, PILLARX_BOOTSTRAP_ADDRESS, initMSA]
  );
};

export const getPillarXAccountAddress = async (
  client: PublicClient,
  owner: `0x${string}`
): Promise<`0x${string}`> =>
  client.readContract({
    address: PILLARX_WALLET_FACTORY_ADDRESS,
    abi: factoryAbi,
    functionName: "getAddress",
    args: [zeroHash, getInitData(owner)],
  });

/**
 * The account only executes calls coming from the EntryPoint, so the owner
 * submits a signed UserOperation to the EntryPoint itself. The UserOperation
 * carries zero gas fees: the account pays nothing and the owner's EOA pays for
 * the transaction, so no bundler or paymaster is needed.
 */
const prepareHandleOps = async (
  client: PublicClient,
  wallet: SignerWallet,
  accountAddress: `0x${string}`,
  call: PillarXCall
) => {
  const owner = wallet.account.address;

  const code = await client.getCode({ address: accountAddress });
  const isDeployed = Boolean(code && code !== "0x");

  // Fails here, before anything is signed or sent, if the call would revert
  const callGas = await client.estimateGas({
    account: accountAddress,
    to: call.to,
    value: call.value,
    data: call.data,
  });

  // The validator that checks the signature is selected by the nonce key
  const nonce = await client.readContract({
    address: entryPoint07Address,
    abi: entryPoint07Abi,
    functionName: "getNonce",
    args: [accountAddress, BigInt(`${PILLARX_ECDSA_VALIDATOR_ADDRESS}00000000`)],
  });

  const userOperation: UserOperation<"0.7"> = {
    sender: accountAddress,
    nonce,
    ...(isDeployed
      ? {}
      : {
          factory: PILLARX_WALLET_FACTORY_ADDRESS,
          factoryData: encodeFunctionData({
            abi: factoryAbi,
            functionName: "createAccount",
            args: [zeroHash, getInitData(owner)],
          }),
        }),
    callData: encodeFunctionData({
      abi: accountAbi,
      functionName: "execute",
      args: [
        SINGLE_EXECUTION_MODE,
        concat([call.to, pad(toHex(call.value), { size: 32 }), call.data]),
      ],
    }),
    callGasLimit: (callGas * 3n) / 2n + 50_000n,
    verificationGasLimit: isDeployed
      ? VERIFICATION_GAS_LIMIT
      : VERIFICATION_GAS_LIMIT_WITH_DEPLOYMENT,
    preVerificationGas: 0n,
    maxFeePerGas: 0n,
    maxPriorityFeePerGas: 0n,
    signature: "0x",
  };

  const userOpHash = getUserOperationHash({
    chainId: wallet.chain.id,
    entryPointAddress: entryPoint07Address,
    entryPointVersion: "0.7",
    userOperation,
  });

  userOperation.signature = await wallet.signMessage({
    message: { raw: userOpHash },
  });

  const request = {
    address: entryPoint07Address,
    abi: entryPoint07Abi,
    functionName: "handleOps",
    args: [[toPackedUserOperation(userOperation)], owner],
    account: wallet.account,
  } as const;

  const gas = await client.estimateContractGas(request);

  return { request, gas: (gas * 12n) / 10n, userOpHash };
};

/**
 * @returns the estimated cost, in wei, for the owner's EOA
 */
export const estimatePillarXCall = async (
  client: PublicClient,
  wallet: SignerWallet,
  accountAddress: `0x${string}`,
  call: PillarXCall
): Promise<bigint> => {
  const { gas } = await prepareHandleOps(client, wallet, accountAddress, call);
  const gasPrice = await client.getGasPrice();

  return gas * gasPrice;
};

/**
 * @returns the transaction hash
 */
export const executePillarXCall = async (
  client: PublicClient,
  wallet: SignerWallet,
  accountAddress: `0x${string}`,
  call: PillarXCall
): Promise<`0x${string}`> => {
  const { request, gas, userOpHash } = await prepareHandleOps(
    client,
    wallet,
    accountAddress,
    call
  );

  const hash = await wallet.writeContract({ ...request, gas });
  const receipt = await client.waitForTransactionReceipt({ hash });

  // The EntryPoint does not revert when the account's own call fails
  const [userOpEvent] = parseEventLogs({
    abi: entryPoint07Abi,
    eventName: "UserOperationEvent",
    logs: receipt.logs,
  }).filter((log) => log.args.userOpHash === userOpHash);

  if (receipt.status !== "success" || !userOpEvent?.args.success) {
    throw new Error(
      `the transaction was mined but the transfer did not go through (transaction: ${hash})`
    );
  }

  return receipt.transactionHash;
};
