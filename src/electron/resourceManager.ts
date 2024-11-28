import { BigNumber, ethers } from "ethers";
import {
  Chain,
  createPublicClient,
  createWalletClient,
  formatEther,
  getContract,
  http,
  parseUnits,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrum, bsc, gnosis, mainnet, optimism, polygon } from "viem/chains";
import { chainMapping } from "./main.js";

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
    const providerWallet = new ethers.Wallet(privateKey);
    return providerWallet.address;
  } catch (error) {
    return `Error to get the EOA address:, ${error}`;
  }
};

export const getAccountAddress = async (privateKey: string) => {
  try {
    const providerWallet = new ethers.Wallet(privateKey);

    // mainnet by default to get the account address
    const chainUrl = chainMapping.ethereum;

    const personalRegistryAbi = await import(
      "./contracts/artifacts-etherspot-v1/PersonalAccountRegistry.json",
      {
        with: { type: "json" },
      }
    );

    const provider = new ethers.providers.JsonRpcProvider(chainUrl);

    const contract = new ethers.Contract(
      ETHERSPOT_V1_PERSONAL_ACCOUNT_REGISTRY_ADDRESS,
      personalRegistryAbi.default.abi,
      provider
    );

    const accountAddress = await contract.computeAccountAddress(
      providerWallet.address
    );

    return accountAddress;
  } catch (error) {
    return `Error to get the account address:, ${error}`;
  }
};

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
async function isContract(
  address: string,
  provider: ethers.providers.JsonRpcProvider
) {
  try {
    const code = await provider.getCode(address);
    if (code !== "0x") return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return false;
  }
}

// Function to filter out invalid addresses
async function filterValidTokens(
  tokens: string[],
  provider: ethers.providers.JsonRpcProvider
) {
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
): Promise<BigNumber[]> => {
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

    const provider = new ethers.providers.JsonRpcProvider(chainUrl);

    const contract = new ethers.Contract(
      ETHERSPOT_V1_BALANCES_HELPER_V2_ADDRESS,
      contractAbi.default.abi,
      provider
    );

    const validTokens = await filterValidTokens(tokenList, provider);

    const result = await contract.getBalances([accountAddress], validTokens);

    return result;
  } catch (error) {
    console.error(`Error to get the balances for chain: ${chain}, ${error}`);
    return [];
  }
};

export const getNativeBalance = async (
  accountAddress: string,
  chain: string
): Promise<string | number> => {
  const chainUrl = chainMapping[chain as Network] || null;

  try {
    if (!chainUrl) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    const provider = new ethers.providers.JsonRpcProvider(chainUrl);

    const nativeTokenBalance = await provider.getBalance(accountAddress);

    const balanceInEther = ethers.utils.formatEther(nativeTokenBalance);

    return Number(balanceInEther);
  } catch (error) {
    return `Error to get the native balance for chain: ${chain}, ${error}`;
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

    const provider = new ethers.providers.JsonRpcProvider(chainUrl);

    const contract = new ethers.Contract(
      tokenAddress,
      erc20Abi.default.abi,
      provider
    );

    const result = await contract.decimals();

    return result;
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
  privateKey: string
): Promise<string> => {
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

    const personalRegistryAbi = await import(
      "./contracts/artifacts-etherspot-v1/PersonalAccountRegistry.json",
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

    const tokenContract = getContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi.default.abi,
      client: wallet,
    });

    const decimals = await tokenContract.read.decimals();

    const amountInUnits = parseUnits(amount, decimals as number);

    // Encode the parameters
    const iface = new ethers.utils.Interface([
      "function transfer(address to, uint256 amount)",
    ]);

    // Encode the function data
    const calldata = iface.encodeFunctionData("transfer", [
      recipientAddress,
      amountInUnits,
    ]);

    const EOAAddress = await getEOAAddress(privateKey);

    const gasEstimate = await client.estimateContractGas({
      address: ETHERSPOT_V1_PERSONAL_ACCOUNT_REGISTRY_ADDRESS as `0x${string}`,
      abi: personalRegistryAbi.default.abi,
      functionName: "executeAccountTransaction",
      args: [accountAddress, tokenAddress, "0", calldata],
      account: EOAAddress as `0x${string}`,
    });

    const gasPriceInWei = await client.getGasPrice();

    const totalCostInWei = gasEstimate * gasPriceInWei;

    const totalCostInNativeToken = ethers.utils.formatEther(totalCostInWei);

    return totalCostInNativeToken;
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
  privateKey: string
): Promise<string> => {
  const chainUrl = chainMapping[chain as Network] || null;

  if (!chainUrl) {
    throw new Error(`Unsupported chain: ${chain}`);
  }

  try {
    const erc20Abi = await import(
      "./contracts/artifacts-etherspot-v1/ERC20Token.json",
      {
        with: { type: "json" },
      }
    );

    const personalRegistryAbi = await import(
      "./contracts/artifacts-etherspot-v1/PersonalAccountRegistry.json",
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

    const accountContract = getContract({
      address: ETHERSPOT_V1_PERSONAL_ACCOUNT_REGISTRY_ADDRESS as `0x${string}`,
      abi: personalRegistryAbi.default.abi,
      client: wallet,
    });

    const tokenContract = getContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi.default.abi,
      client: wallet,
    });

    const decimals = await tokenContract.read.decimals();

    const amountInUnits = parseUnits(amount, decimals as number);

    // Encode the parameters
    const iface = new ethers.utils.Interface([
      "function transfer(address to, uint256 amount)",
    ]);

    // Encode the function data
    const calldata = iface.encodeFunctionData("transfer", [
      recipientAddress,
      amountInUnits,
    ]);

    const tx = await accountContract.write.executeAccountTransaction([
      accountAddress,
      tokenAddress,
      "0",
      calldata,
    ]);

    const receipt = await client.waitForTransactionReceipt({
      hash: tx,
    });

    return receipt.transactionHash;
  } catch (error) {
    return `Error transferring tokens: ${error}`;
  }
};

// TO DO - use it in future versions
export const getNftName = async (
  nftAddress: string,
  chain: string
): Promise<number | undefined> => {
  const chainUrl = chainMapping[chain as Network] || null;

  if (!chainUrl) {
    console.error(`Unsupported chain: ${chain}`);
    return 0;
  }

  try {
    // ERC-721 or ERC-1155 ABI
    const abi = ["function name() view returns (string)"];

    const provider = new ethers.providers.JsonRpcProvider(chainUrl);

    const contract = new ethers.Contract(nftAddress, abi, provider);

    const nftName = await contract.name();
    return nftName;
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

    const provider = new ethers.providers.JsonRpcProvider(chainUrl);

    const contractERC721 = new ethers.Contract(
      nftAddress,
      abiERC721.default,
      provider
    );

    const contractERC1155 = new ethers.Contract(
      nftAddress,
      abiERC1155.default,
      provider
    );

    try {
      // Attempt ERC721 balance
      const resultERC721 = await contractERC721.balanceOf(accountAddress);
      return processBigNumber(resultERC721);
    } catch (errorERC721) {
      console.warn(`ERC721 balance fetch failed: ${errorERC721}`);

      // Fallback to ERC1155
      try {
        const resultERC1155 = await contractERC1155.balanceOf(
          accountAddress,
          nftId
        );
        return processBigNumber(resultERC1155);
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
  privateKey: string
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

    const client = createPublicClient({
      chain: getNetworkViem(chain as Network),
      transport: http(chainUrl),
    });

    const wallet = createWalletClient({
      chain: getNetworkViem(chain as Network),
      transport: http(chainUrl),
      account: privateKeyToAccount(privateKey as `0x${string}`),
    });

    const accountContract = getContract({
      address: ETHERSPOT_V1_PERSONAL_ACCOUNT_REGISTRY_ADDRESS as `0x${string}`,
      abi: personalRegistryAbi.default.abi,
      client: wallet,
    });

    // Encode the parameters
    const ifaceERC721 = new ethers.utils.Interface([
      "function safeTransferFrom(address from, address to, uint256 tokenId)",
    ]);

    const ifaceERC1155 = new ethers.utils.Interface([
      "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)",
    ]);

    // Encode the function data
    const calldataERC721 = ifaceERC721.encodeFunctionData("safeTransferFrom", [
      accountAddress,
      recipientAddress,
      nftId,
    ]);

    const calldataERC1155 = ifaceERC1155.encodeFunctionData(
      "safeTransferFrom",
      [accountAddress, recipientAddress, nftId, "1", "0x"]
    );

    // Try ERC721 transfer
    try {
      const tx = await accountContract.write.executeAccountTransaction([
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
        const tx = await accountContract.write.executeAccountTransaction([
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
