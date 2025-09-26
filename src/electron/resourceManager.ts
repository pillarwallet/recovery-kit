import { BigNumber, ethers } from "ethers";
import {
  Chain,
  PublicClient,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  formatEther,
  getContract,
  http,
  parseUnits,
} from "viem";
import type { Abi, EstimateGasErrorType } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrum, bsc, gnosis, mainnet, optimism, polygon } from "viem/chains";
import { chainMapping } from "./main.js";
import { promises as fs } from "fs";
import * as path from "path";
import { app } from "electron";
import archanovaAllAbi from "./contracts/archanova/all.json" with { type: "json" };

// utils
import {
  ETHERSPOT_V1_BALANCES_HELPER_V2_ADDRESS,
  ETHERSPOT_V1_PERSONAL_ACCOUNT_REGISTRY_ADDRESS,
  processBigNumber,
} from "./utils.js";

const getNetworkViem = (network: Network): Chain => {
  switch (network) {
    case "ethereum":
      return mainnet;
    case "polygon":
      return polygon;
    case "optimism":
      return optimism;
    case "arbitrum":
      return arbitrum;
    case "xdai":
      return gnosis;
    case "binance":
      return bsc;
    default:
      return mainnet;
  }
};

export const getEOAAddress = async (privateKey: string): Promise<string> => {
  try {
    // mainnet by default to get the account address
    const chainUrl = chainMapping.ethereum;

    const providerWallet = createWalletClient({
      account: privateKeyToAccount(privateKey as `0x${string}`),
      chain: mainnet,
      transport: http(chainUrl),
    });

    return providerWallet.account.address;
  } catch (error) {
    return `Error to get the EOA address:, ${error}`;
  }
};

export const getAccountAddress = async (privateKey: string) => {
  try {
    // mainnet by default to get the account address
    const chainUrl = chainMapping.ethereum;

    if (!chainUrl) {
      throw new Error(`Unsupported chain: ${chainUrl}`);
    }

    const providerWallet = createWalletClient({
      account: privateKeyToAccount(privateKey as `0x${string}`),
      chain: mainnet,
      transport: http(chainUrl),
    });

    const personalRegistryAbi = await import(
      "./contracts/artifacts-etherspot-v1/PersonalAccountRegistry.json",
      {
        with: { type: "json" },
      }
    );

    const provider = createPublicClient({
      chain: getNetworkViem("ethereum"),
      transport: http(chainUrl),
    });

    const accountContract = getContract({
      address: ETHERSPOT_V1_PERSONAL_ACCOUNT_REGISTRY_ADDRESS as `0x${string}`,
      abi: personalRegistryAbi.default.abi,
      client: provider,
    });

    const accountAddress = await accountContract.read.computeAccountAddress([
      providerWallet.account.address,
    ]);

    return accountAddress as string;
  } catch (error) {
    return `Error to get the account address:, ${error}`;
  }
};

export const getArchanovaAddress = async (
  privateKey: string
): Promise<string> => {
  try {
    // Get the EOA address from the private key
    const eoaAddress = await getEOAAddress(privateKey);
    
    // Check if getEOAAddress returned an error
    if (eoaAddress.startsWith('Error')) {
      return eoaAddress;
    }

    // Load the mapped archanova accounts data
    const mappedAccountsPath = path.join(app.getAppPath(), 'dist-electron', 'src', 'electron', 'data', 'mapped_archanova_accounts.json');
    const mappedAccountsData = await fs.readFile(mappedAccountsPath, 'utf8');
    const mappedAccounts = JSON.parse(mappedAccountsData);

    // Search for the matching eoaAddress
    const matchingAccount = mappedAccounts.find((account: { eoaAddress: string; archanovaAddress: string }) => 
      account.eoaAddress.toLowerCase() === eoaAddress.toLowerCase()
    );

    if (matchingAccount) {
      return matchingAccount.archanovaAddress;
    } else {
      return 'no address found';  
    }
  } catch (error) {
    return `Error getting archanova address: ${error}`;
  }
};

export const getArchanovaAccountId = async (
  privateKey: string
): Promise<string> => {
  try {
    // Get the EOA address from the private key
    const eoaAddress = await getEOAAddress(privateKey);
    
    // Check if getEOAAddress returned an error
    if (eoaAddress.startsWith('Error')) {
      return eoaAddress;
    }

    // Load the mapped archanova accounts data
    const mappedAccountsPath = path.join(app.getAppPath(), 'dist-electron', 'src', 'electron', 'data', 'mapped_archanova_accounts.json');
    const mappedAccountsData = await fs.readFile(mappedAccountsPath, 'utf8');
    const mappedAccounts = JSON.parse(mappedAccountsData);

    // Search for the matching eoaAddress
    const matchingAccount = mappedAccounts.find((account: { eoaAddress: string; accountId: number }) => 
      account.eoaAddress.toLowerCase() === eoaAddress.toLowerCase()
    );

    if (matchingAccount) {
      return matchingAccount.accountId.toString();
    } else {
      return 'no account id found';
    }
  } catch (error) {
    return `Error getting archanova account id: ${error}`;
  }
};

// Using the ethers librairy because it allows to get the private key from the mnemonic wallet
// while Viem librairy does not provide the private key from the mnemonic wallet
export const submitMnemonic = async (
  mnemonicWords: string[]
): Promise<string> => {
  try {
    const mnemonicPhrase = mnemonicWords.join(" ");

    const mnemonicWallet = ethers.Wallet.fromMnemonic(mnemonicPhrase);

    const accountAddress = await getAccountAddress(mnemonicWallet.privateKey);

    return accountAddress;
  } catch (error) {
    return `Error processing the 12 words phrase: ${error}`;
  }
};

// Using the ethers librairy because it allows to get the private key from the mnemonic wallet
// while Viem librairy does not provide the private key from the mnemonic wallet
export const getPrivateKey = async (
  mnemonicWords: string[]
): Promise<string> => {
  try {
    const mnemonicPhrase = mnemonicWords.join(" ");

    const mnemonicWallet = ethers.Wallet.fromMnemonic(mnemonicPhrase);

    return mnemonicWallet.privateKey;
  } catch (error) {
    return `Error getting the private key: ${error}`;
  }
};

// Function to check if an address is a contract
async function isContract(address: string, provider: PublicClient) {
  try {
    const code = await provider.getCode({ address: address as `0x${string}` });
    if (code !== "0x") return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return false;
  }
}

// Function to filter out invalid addresses
async function filterValidTokens(tokens: string[], provider: PublicClient) {
  const validTokens = [];
  for (const token of tokens) {
    if (
      token !== ethers.constants.AddressZero &&
      (await isContract(token, provider))
    ) {
      validTokens.push(token);
    }
  }
  return validTokens;
}

export const getBalances = async (
  accountAddress: string,
  tokenList: string[],
  chain: string
): Promise<bigint[]> => {
  const chainUrl = chainMapping[chain as Network] || null;

  try {
    if (!chainUrl) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    const contractAbi = await import(
      "./contracts/artifacts-etherspot-v1/BalancesHelperV2.json",
      {
        with: { type: "json" },
      }
    );

    const provider = createPublicClient({
      chain: getNetworkViem(chain as Network),
      transport: http(chainUrl),
    });

    const contract = getContract({
      address: ETHERSPOT_V1_BALANCES_HELPER_V2_ADDRESS as `0x${string}`,
      abi: contractAbi.default.abi,
      client: provider,
    });

    const validTokens = await filterValidTokens(tokenList, provider);

    const result = await contract.read.getBalances([
      [accountAddress],
      validTokens,
    ]);

    return result as bigint[];
  } catch (error) {
    console.error(`Error to get the balances for chain: ${chain}, ${error}`);
    return [];
  }
};

export const getNativeBalance = async (
  accountAddress: string,
  chain: string
): Promise<string> => {
  const chainUrl = chainMapping[chain as Network] || null;

  try {
    if (!chainUrl) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    const provider = createPublicClient({
      chain: getNetworkViem(chain as Network),
      transport: http(chainUrl),
    });

    const nativeTokenBalance = await provider.getBalance({
      address: accountAddress as `0x${string}`,
    });

    const balanceInEther = formatEther(nativeTokenBalance);

    return balanceInEther;
  } catch (error) {
    return `Error to get the native balance for chain: ${chain}, ${error}`;
  }
};

export const getCode = async (
  address: string,
  chain: string
): Promise<string> => {
  const chainUrl = chainMapping[chain as Network] || null;

  try {
    if (!chainUrl) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    const provider = createPublicClient({
      chain: getNetworkViem(chain as Network),
      transport: http(chainUrl),
    });

    const code = await provider.getCode({
      address: address as `0x${string}`,
    });

    return code || "0x";
  } catch (error) {
    return `Error getting code for address: ${error}`;
  }
};

export const estimateArchanovaDeploymentCost = async (
  chain: string,
  privateKey: string,
  _archanovaAddress: string
): Promise<string> => {
  /**
   * NOTE: This is currently not in use
   * whilst we figure out how we get around the
   * guardian contract issue.
   * 
   * This function is presently a work in 
   * progress and should be ignored.
   */
  const chainUrl = chainMapping[chain as Network] || null;

  if (!chainUrl) {
    throw new Error(`Unsupported chain: ${chain}`);
  }

  try {
    const client = createPublicClient({
      chain: getNetworkViem(chain as Network),
      transport: http(chainUrl),
    });

    // Touch the provided Archanova address to satisfy type usage and potential future logic hooks
    try {
      await client.getCode({ address: _archanovaAddress as `0x${string}` });
    } catch {
      // ignore
    }

    const wallet = createWalletClient({
      chain: getNetworkViem(chain as Network),
      transport: http(chainUrl),
      account: privateKeyToAccount(privateKey as `0x${string}`),
    });

    const eoaAddress = await getEOAAddress(privateKey);
    const accountId = await getArchanovaAccountId(privateKey);

    const gasEstimate = await client.estimateContractGas({
      address: "0x5913711B94F0e3c0fC933E400DF94321436163FE",
      abi: archanovaAllAbi.AccountProviderV2.abi,
      functionName: "unsafeCreateAccount",
      args: [BigInt(accountId), eoaAddress, "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000000", 0],
      account: wallet.account,
    });

    const gasPriceInWei = await client.getGasPrice();
    const totalCostInWei = gasEstimate * gasPriceInWei;

    return formatEther(totalCostInWei);
  } catch (e) {
    const error = e as EstimateGasErrorType;
    return `We ran into an issue: ${error.shortMessage || String(e)} You need around 0.0004 ETH in your EOA Wallet to deploy the contract.`;
  }
};

export const deployArchanovaContract = async (
  chain: string,
  privateKey: string,
  _archanovaAddress: string
): Promise<string> => {
  /**
   * NOTE: This is currently not in use
   * whilst we figure out how we get around the
   * guardian contract issue.
   * 
   * This function is presently a work in 
   * progress and should be ignored.
   */
  const chainUrl = chainMapping[chain as Network] || null;

  if (!chainUrl) {
    throw new Error(`Unsupported chain: ${chain}`);
  }

  try {
    const archanovaAbi = await import(
      "./contracts/archanova/account.json",
      {
        with: { type: "json" },
      }
    );

    const abi = archanovaAbi.default.abi as Abi;
    type SolcBytecode = { object: string };
    const rawBytecode: unknown = (archanovaAbi.default as { bytecode?: string | SolcBytecode }).bytecode;
    let bytecodeHex: `0x${string}`;
    if (typeof rawBytecode === "string") {
      bytecodeHex = (rawBytecode.startsWith("0x") ? rawBytecode : (`0x${rawBytecode}`)) as `0x${string}`;
    } else if (
      rawBytecode &&
      typeof (rawBytecode as SolcBytecode).object === "string"
    ) {
      const objectHex = (rawBytecode as SolcBytecode).object as string;
      bytecodeHex = (objectHex.startsWith("0x") ? objectHex : (`0x${objectHex}`)) as `0x${string}`;
    } else {
      throw new Error("Invalid Archanova bytecode format in ABI file");
    }

    const client = createPublicClient({
      chain: getNetworkViem(chain as Network),
      transport: http(chainUrl),
    });

    const wallet = createWalletClient({
      chain: getNetworkViem(chain as Network),
      transport: http(chainUrl),
      account: privateKeyToAccount(privateKey as `0x${string}`),
    });

    // Touch the provided Archanova address to satisfy type usage and potential future logic hooks
    try {
      await client.getCode({ address: _archanovaAddress as `0x${string}` });
    } catch {
      // ignore
    }

    // Use bytecodeHex for potential future direct deployment logic
    console.log("Bytecode ready for deployment:", bytecodeHex ? "yes" : "no");

    /**
     * Call the deployment contract
     */
    const hash = await wallet.writeContract({
      address: "0x5913711B94F0e3c0fC933E400DF94321436163FE",
      abi,
      functionName: "deployAccount",
      args: [],
    });

    const receipt = await client.waitForTransactionReceipt({ hash });
    return receipt.transactionHash;
  } catch (e) {
    const error = e as EstimateGasErrorType;
    return `We ran into an issue: ${error.shortMessage || String(e)}`;
  }
};

export const getDecimal = async (
  tokenAddress: string,
  chain: string
): Promise<string | number> => {
  const chainUrl = chainMapping[chain as Network] || null;

  try {
    if (!chainUrl) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    const erc20Abi = await import(
      "./contracts/artifacts-etherspot-v1/ERC20Token.json",
      {
        with: { type: "json" },
      }
    );

    const provider = createPublicClient({
      chain: getNetworkViem(chain as Network),
      transport: http(chainUrl),
    });

    const contract = getContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi.default.abi,
      client: provider,
    });

    const result = await contract.read.decimals();

    return result as number;
  } catch (error) {
    return `Error to get the decimal for token: ${tokenAddress}, ${error}`;
  }
};

export const estimateGas = async (
  accountAddress: string,
  tokenAddress: string,
  recipientAddress: string,
  amount: string,
  chain: string,
  privateKey: string,
  contractType: ContractsType
): Promise<string> => {
  const chainUrl = chainMapping[chain as Network] || null;

  try {
    if (!chainUrl) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    /**
     * Import ERC20 ABI
     */
    const erc20Abi = await import(
      "./contracts/artifacts-etherspot-v1/ERC20Token.json",
      {
        with: { type: "json" },
      }
    );

    /**
     * Import Etherspot Account v1 ABI
     */
    const personalRegistryAbi = await import(
      "./contracts/artifacts-etherspot-v1/PersonalAccountRegistry.json",
      {
        with: { type: "json" },
      }
    );

    /**
     * Import Archanova Account ABI
     */
    const archanovaAbi = await import(
      "./contracts/archanova/account.json",
      {
        with: { type: "json" },
      }
    );


    /**
     * Create a public client
     */
    const client = createPublicClient({
      chain: getNetworkViem(chain as Network),
      transport: http(chainUrl),
    });

    /**
     * Create a wallet client
     */
    const wallet = createWalletClient({
      chain: getNetworkViem(chain as Network),
      transport: http(chainUrl),
      account: privateKeyToAccount(privateKey as `0x${string}`),
    });

    /**
     * Create a token contract
     */
    const tokenContract = getContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi.default.abi,
      client: wallet,
    });

    const decimals =
      tokenAddress === ethers.constants.AddressZero
        ? 18
        : await tokenContract.read.decimals();

    const amountInUnits = parseUnits(amount, decimals as number);
    const EOAAddress = await getEOAAddress(privateKey);

    /**
     * Native token transfer
     */
    if (tokenAddress === ethers.constants.AddressZero) {
      /**
       * ... for Archanova account
       */
      if (contractType === "archanova") {
        const gasEstimate = await client.estimateContractGas({
          address: accountAddress as `0x${string}`,
          abi: archanovaAbi.default.abi as Abi,
          functionName: "executeTransaction",
          args: [recipientAddress, amountInUnits, "0x"],
          account: EOAAddress as `0x${string}`,
        });
        const gasPriceInWei = await client.getGasPrice();
        const totalCostInWei = gasEstimate * gasPriceInWei;
        return formatEther(totalCostInWei);
      }

      /**
       * ... for Etherspot Account v1
       */
      const gasEstimate = await client.estimateContractGas({
        address:
          ETHERSPOT_V1_PERSONAL_ACCOUNT_REGISTRY_ADDRESS as `0x${string}`,
        abi: personalRegistryAbi.default.abi,
        functionName: "executeAccountTransaction",
        args: [accountAddress, recipientAddress, amountInUnits, "0x"],
        account: EOAAddress as `0x${string}`,
      });

      const gasPriceInWei = await client.getGasPrice();
      const totalCostInWei = gasEstimate * gasPriceInWei;
      return formatEther(totalCostInWei);
    } else {
      /**
       * ... for ERC20 token
       */

      // The ERC20 transfer
      const calldata = encodeFunctionData({
        abi: erc20Abi.default.abi,
        functionName: "transfer",
        args: [recipientAddress, amountInUnits],
      });

      /**
       * ... for Archanova account
       */
      if (contractType === "archanova") {
        const gasEstimate = await client.estimateContractGas({
          address: accountAddress as `0x${string}`,
          abi: archanovaAbi.default.abi as Abi,
          functionName: "executeTransaction",
          args: [tokenAddress, "0", calldata],
          account: EOAAddress as `0x${string}`,
        });
        const gasPriceInWei = await client.getGasPrice();
        const totalCostInWei = gasEstimate * gasPriceInWei;
        return formatEther(totalCostInWei);
      }

      /**
       * ... for Etherspot Account v1
       */
      const gasEstimate = await client.estimateContractGas({
        address:
          ETHERSPOT_V1_PERSONAL_ACCOUNT_REGISTRY_ADDRESS as `0x${string}`,
        abi: personalRegistryAbi.default.abi,
        functionName: "executeAccountTransaction",
        args: [accountAddress, tokenAddress, "0", calldata],
        account: EOAAddress as `0x${string}`,
      });

      const gasPriceInWei = await client.getGasPrice();
      const totalCostInWei = gasEstimate * gasPriceInWei;
      return formatEther(totalCostInWei);
    }
  } catch (error) {
    return `Error estimating gas for transfer: ${error}`;
  }
};

export const transferTokens = async (
  accountAddress: string,
  tokenAddress: string,
  recipientAddress: string,
  amount: string,
  chain: string,
  privateKey: string,
  contractType: ContractsType
): Promise<string> => {
  const chainUrl = chainMapping[chain as Network] || null;

  if (!chainUrl) {
    throw new Error(`Unsupported chain: ${chain}`);
  }

  try {
    /**
     * Import ERC20 ABI
     */
    const erc20Abi = await import(
      "./contracts/artifacts-etherspot-v1/ERC20Token.json",
      {
        with: { type: "json" },
      }
    );

    /**
     * Import Etherspot Account v1 ABI
     */
    const personalRegistryAbi = await import(
      "./contracts/artifacts-etherspot-v1/PersonalAccountRegistry.json",
      {
        with: { type: "json" },
      }
    );

    /**
     * Import Archanova Account ABI
     */
    const archanovaAbi = await import(
      "./contracts/archanova/account.json",
      {
        with: { type: "json" },
      }
    );

    /**
     * Create a public client
     */
    const client = createPublicClient({
      chain: getNetworkViem(chain as Network),
      transport: http(chainUrl),
    });

    /**
     * Create a wallet client
     */
    const wallet = createWalletClient({
      chain: getNetworkViem(chain as Network),
      transport: http(chainUrl),
      account: privateKeyToAccount(privateKey as `0x${string}`),
    });

    /**
     * Create a Etherspot Account v1 contract
     */
    const etherspotAccountContract = getContract({
      address: ETHERSPOT_V1_PERSONAL_ACCOUNT_REGISTRY_ADDRESS as `0x${string}`,
      abi: personalRegistryAbi.default.abi,
      client: wallet,
    });

    /**
     * Create a Archanova account contract
     */
    const archanovaAccount = getContract({
      address: accountAddress as `0x${string}`,
      abi: archanovaAbi.default.abi as Abi,
      client: wallet,
    });

    /**
     * Create a ERC20 token contract
     */
    const tokenContract = getContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi.default.abi,
      client: wallet,
    });

    const decimals =
      tokenAddress === ethers.constants.AddressZero
        ? 18
        : await tokenContract.read.decimals();

    const amountInUnits = parseUnits(amount, decimals as number);

    /**
     * Native token transfer
     */
    if (tokenAddress === ethers.constants.AddressZero) {
      /**
       * ... for Archanova account
       */
      if (contractType === "archanova") {
        const tx = await archanovaAccount.write.executeTransaction([
          recipientAddress,
          amountInUnits,
          "0x",
        ]);

        const receipt = await client.waitForTransactionReceipt({
          hash: tx,
        });
  
        return receipt.transactionHash;
      } else {
        /**
         * ... for Etherspot Account v1
         */
        const tx = await etherspotAccountContract.write.executeAccountTransaction([
          accountAddress,
          recipientAddress,
          amountInUnits,
          "0x",
        ]);

        const receipt = await client.waitForTransactionReceipt({
          hash: tx,
        });
  
        return receipt.transactionHash;
      }
    } else {
      /**
       * ... for ERC20 token
       */
      /**
       * ... for Archanova account
       */

      if (contractType === "archanova") {
        const calldata = encodeFunctionData({
          abi: erc20Abi.default.abi,
          functionName: "transfer",
          args: [recipientAddress, amountInUnits],
        });

        const tx = await archanovaAccount.write.executeTransaction([
          tokenAddress,
          "0",
          calldata,
        ]);
        const receipt = await client.waitForTransactionReceipt({ hash: tx });
        return receipt.transactionHash;
      }

      /**
       * ... for Etherspot Account v1
       */
      const calldata = encodeFunctionData({
        abi: erc20Abi.default.abi,
        functionName: "transfer",
        args: [recipientAddress, amountInUnits],
      });

      const tx = await etherspotAccountContract.write.executeAccountTransaction([
        accountAddress,
        tokenAddress,
        "0",
        calldata,
      ]);

      const receipt = await client.waitForTransactionReceipt({
        hash: tx,
      });

      return receipt.transactionHash;
    }
  } catch (error) {
    return `Error transferring tokens: ${error}`;
  }
};

// TO DO - use it in future versions
export const getNftName = async (
  nftAddress: string,
  chain: string
): Promise<string | undefined> => {
  const chainUrl = chainMapping[chain as Network] || null;

  if (!chainUrl) {
    console.error(`Unsupported chain: ${chain}`);
    return "";
  }

  try {
    // ERC-721 or ERC-1155 ABI
    const abiERC721 = await import(
      "./contracts/artifacts-etherspot-v1/ERC721.json",
      {
        with: { type: "json" },
      }
    );

    const provider = createPublicClient({
      chain: getNetworkViem(chain as Network),
      transport: http(chainUrl),
    });

    const contract = getContract({
      address: nftAddress as `0x${string}`,
      abi: abiERC721.default,
      client: provider,
    });

    const nftName = await contract.read.name();
    return nftName as string;
  } catch (error) {
    console.error(`Unexpected error fetching name for ${nftAddress}: ${error}`);
    return undefined;
  }
};

export const getNftBalance = async (
  accountAddress: string,
  nftAddress: string,
  nftId: string,
  chain: string
): Promise<number> => {
  const chainUrl = chainMapping[chain as Network] || null;

  if (!chainUrl) {
    console.error(`Unsupported chain: ${chain}`);
    return 0;
  }

  try {
    const abiERC721 = await import(
      "./contracts/artifacts-etherspot-v1/ERC721.json",
      {
        with: { type: "json" },
      }
    );

    const abiERC1155 = await import(
      "./contracts/artifacts-etherspot-v1/ERC1155.json",
      {
        with: { type: "json" },
      }
    );

    const provider = createPublicClient({
      chain: getNetworkViem(chain as Network),
      transport: http(chainUrl),
    });

    const contractERC721 = getContract({
      address: nftAddress as `0x${string}`,
      abi: abiERC721.default,
      client: provider,
    });

    const contractERC1155 = getContract({
      address: nftAddress as `0x${string}`,
      abi: abiERC1155.default,
      client: provider,
    });

    try {
      // Attempt ERC721 balance
      const resultERC721 = await contractERC721.read.balanceOf([
        accountAddress,
      ]);
      return processBigNumber(resultERC721 as BigNumber);
    } catch (errorERC721) {
      console.warn(`ERC721 balance fetch failed: ${errorERC721}`);

      // Fallback to ERC1155
      try {
        const resultERC1155 = await contractERC1155.read.balanceOf([
          accountAddress,
          nftId,
        ]);
        return processBigNumber(resultERC1155 as BigNumber);
      } catch (errorERC1155) {
        console.error(`ERC1155 balance fetch also failed: ${errorERC1155}`);
        return 0;
      }
    }
  } catch (error) {
    console.error(
      `Unexpected error fetching balances for chain ${chain}: ${error}`
    );
    return 0;
  }
};

export const estimateGasNftTransfer = async (
  accountAddress: string,
  recipientAddress: string,
  nftAddress: string,
  nftId: string,
  chain: string
): Promise<string> => {
  const chainUrl = chainMapping[chain as Network] || null;

  if (!chainUrl) {
    throw new Error(`Unsupported chain: ${chain}`);
  }

  try {
    const erc721Abi = await import(
      "./contracts/artifacts-etherspot-v1/ERC721.json",
      {
        with: { type: "json" },
      }
    );

    const erc1155Abi = await import(
      "./contracts/artifacts-etherspot-v1/ERC1155.json",
      {
        with: { type: "json" },
      }
    );

    const client = createPublicClient({
      chain: getNetworkViem(chain as Network),
      transport: http(chainUrl),
    });

    // Try ERC721 gas estimation
    try {
      const gasEstimateERC721 = await client.estimateContractGas({
        address: nftAddress as `0x${string}`,
        abi: erc721Abi.default,
        functionName: "safeTransferFrom",
        args: [accountAddress, recipientAddress, nftId],
        account: accountAddress as `0x${string}`,
      });

      const gasPrice = await client.getGasPrice();

      const totalCostInWei = gasEstimateERC721 * gasPrice;

      const totalCostInGasToken = formatEther(totalCostInWei);

      return totalCostInGasToken;
    } catch (errorERC721) {
      console.warn(`ERC721 gas estimation failed: ${errorERC721}`);
      console.warn("Attempting ERC1155 gas estimation...");

      // Fallback to ERC1155 gas estimation
      try {
        const gasEstimateERC1155 = await client.estimateContractGas({
          address: nftAddress as `0x${string}`,
          abi: erc1155Abi.default,
          functionName: "safeTransferFrom",
          args: [
            accountAddress,
            recipientAddress,
            nftId,
            1, // Quantity: assume 1 for ERC1155?
            "0x", // Additional calldata
          ],
          account: accountAddress as `0x${string}`,
        });
        const gasPrice = await client.getGasPrice();

        const totalCostInWei = gasEstimateERC1155 * gasPrice;

        const totalCostInGasToken = formatEther(totalCostInWei);

        return totalCostInGasToken;
      } catch (errorERC1155) {
        console.error(`ERC1155 gas estimation also failed: ${errorERC1155}`);
        return `Error estimating gas: both ERC721 and ERC1155 failed.`;
      }
    }
  } catch (error) {
    return `Error estimating gas for transfer: ${error}`;
  }
};

export const transferNft = async (
  accountAddress: string,
  recipientAddress: string,
  nftAddress: string,
  nftId: string,
  chain: string,
  privateKey: string,
  contractType: ContractsType
): Promise<string> => {
  const chainUrl = chainMapping[chain as Network] || null;

  if (!chainUrl) {
    throw new Error(`Unsupported chain: ${chain}`);
  }

  try {
    const personalRegistryAbi = await import(
      "./contracts/artifacts-etherspot-v1/PersonalAccountRegistry.json",
      {
        with: { type: "json" },
      }
    );

    const archanovaAbi = await import(
      "./contracts/archanova/account.json",
      {
        with: { type: "json" },
      }
    );

    const erc721Abi = await import(
      "./contracts/artifacts-etherspot-v1/ERC721.json",
      {
        with: { type: "json" },
      }
    );

    const erc1155Abi = await import(
      "./contracts/artifacts-etherspot-v1/ERC1155.json",
      {
        with: { type: "json" },
      }
    );

    const client = createPublicClient({
      chain: getNetworkViem(chain as Network),
      transport: http(chainUrl),
    });

    const wallet = createWalletClient({
      chain: getNetworkViem(chain as Network),
      transport: http(chainUrl),
      account: privateKeyToAccount(privateKey as `0x${string}`),
    });

    /**
     * Create a Etherspot Account v1 contract
     */
    const etherspotAccountContract = getContract({
      address: ETHERSPOT_V1_PERSONAL_ACCOUNT_REGISTRY_ADDRESS as `0x${string}`,
      abi: personalRegistryAbi.default.abi,
      client: wallet,
    });

    /**
     * Create a Archanova account contract
     */
    const archanovaAccount = getContract({
      address: accountAddress as `0x${string}`,
      abi: archanovaAbi.default.abi as Abi,
      client: wallet,
    });

    // Encode the function data
    const calldataERC721 = encodeFunctionData({
      abi: erc721Abi.default as Abi,
      functionName: "safeTransferFrom",
      args: [accountAddress, recipientAddress, nftId],
    });

    const calldataERC1155 = encodeFunctionData({
      abi: erc1155Abi.default as Abi,
      functionName: "safeTransferFrom",
      args: [accountAddress, recipientAddress, nftId, "1", "0x"],
    });

    // Try ERC721 transfer
    try {
      if (contractType === "archanova") {
        const tx = await archanovaAccount.write.executeTransaction([
          nftAddress,
          "0",
          calldataERC721,
        ]);
        const receipt = await client.waitForTransactionReceipt({ hash: tx });
        return receipt.transactionHash;
      }

      const tx = await etherspotAccountContract.write.executeAccountTransaction([
        accountAddress,
        nftAddress,
        "0",
        calldataERC721,
      ]);

      const receipt = await client.waitForTransactionReceipt({
        hash: tx,
      });

      return receipt.transactionHash;
    } catch (errorERC721) {
      console.warn(`ERC721 transfer failed: ${errorERC721}`);

      // Fallback to ERC1155 transfer
      try {
        if (contractType === "archanova") {
          const tx = await archanovaAccount.write.executeTransaction([
            nftAddress,
            "0",
            calldataERC1155,
          ]);
          const receipt = await client.waitForTransactionReceipt({ hash: tx });
          return receipt.transactionHash;
        }

        const tx = await etherspotAccountContract.write.executeAccountTransaction([
          accountAddress,
          nftAddress,
          "0",
          calldataERC1155,
        ]);

        const receipt = await client.waitForTransactionReceipt({
          hash: tx,
        });

        return receipt.transactionHash;
      } catch (errorERC1155) {
        console.error(`ERC1155 transfer also failed: ${errorERC1155}`);
        return `Error transferring NFT: both ERC721 and ERC1155 failed.`;
      }
    }
  } catch (error) {
    return `Error executing NFT transfer: ${error}`;
  }
};
