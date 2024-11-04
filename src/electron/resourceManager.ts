import { BrowserWindow } from "electron";
import { ethers } from "ethers";
import fs from "fs";
import os from "os";
import osUtils from "os-utils";
import { ipcWebContentsSend } from "./util.js";

const POLLING_INTERVAL = 500;

export function pollResources(mainWindow: BrowserWindow) {
  setInterval(async () => {
    const cpuUsage = await getCpuUsage();
    const ramUsage = getRamUsage();
    const storageData = getStorageData();
    ipcWebContentsSend("statistics", mainWindow.webContents, {
      cpuUsage,
      ramUsage,
      storageUsage: storageData.usage,
    });
  }, POLLING_INTERVAL);
}

export function getStaticData() {
  const totalStorage = getStorageData().total;
  const cpuModel = os.cpus()[0].model;
  const totalMemoryGB = Math.floor(osUtils.totalmem() / 1024);

  return {
    totalStorage,
    cpuModel,
    totalMemoryGB,
  };
}

function getCpuUsage(): Promise<number> {
  return new Promise((resolve) => {
    osUtils.cpuUsage(resolve);
  });
}

function getRamUsage() {
  return 1 - osUtils.freememPercentage();
}

function getStorageData() {
  const stats = fs.statfsSync(process.platform === "win32" ? "C://" : "/");
  const total = stats.bsize * stats.blocks;
  const free = stats.bsize * stats.bfree;

  return {
    total: Math.floor(total / 1_000_000_000),
    usage: 1 - free / total,
  };
}

export const getAccountAddress = async (privateKey: string) => {
  try {
    const providerWallet = new ethers.Wallet(privateKey);

    console.log("THE EOA", providerWallet.address);

    const INFURA_URL = `https://mainnet.infura.io/v3/${process.env.REACT_APP_API_KEY}`;

    const abi = await import(
      "./contracts/artifacts-etherspot-v1/PersonalAccountRegistry.json",
      {
        with: { type: "json" },
      }
    );

    const PERSONAL_ACCOUNT_REGISTRY_ADDRESS =
      "0x7EB3A038F25B9F32f8e19A7F0De83D4916030eFa";

    const provider = new ethers.providers.JsonRpcProvider(INFURA_URL);

    const contract = new ethers.Contract(
      PERSONAL_ACCOUNT_REGISTRY_ADDRESS,
      abi.default.abi,
      provider
    );

    const result = await contract.computeAccountAddress(providerWallet.address);

    return result;
  } catch (error) {
    return `Error to get the account address:", ${error}`;
  }
};

export const submitMnemonic = async (mnemonicWords: string[]) => {
  try {
    const mnemonicPhrase = mnemonicWords.join(" ");

    const mnemonicWallet = ethers.Wallet.fromMnemonic(mnemonicPhrase);

    const accountAddress = await getAccountAddress(mnemonicWallet.privateKey);

    return accountAddress;
  } catch (error) {
    return `Error processing the 12 words phrase: ${error}`;
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
) => {
  const chainName = () => {
    const chainMapping: Record<Network, string> = {
      ethereum: "mainnet",
      polygon: "polygon-mainnet",
      optimism: "optimism-mainnet",
      arbitrum: "arbitrum-mainnet",
      binance: "bsc-mainnet",
    };

    return chainMapping[chain as Network] || null;
  };

  try {
    const chainUrl = chainName();
    if (!chainUrl) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    const INFURA_URL = `https://${chainUrl}.infura.io/v3/${process.env.REACT_APP_API_KEY}`;

    const abi = await import(
      "./contracts/artifacts-etherspot-v1/BalancesHelperV2.json",
      {
        with: { type: "json" },
      }
    );

    const BALANCES_HELPER_V2_ADDRESS =
      "0xe5A160F89f330cc933816E896a3F36376DE0a835";

    const provider = new ethers.providers.JsonRpcProvider(INFURA_URL);

    const contract = new ethers.Contract(
      BALANCES_HELPER_V2_ADDRESS,
      abi.default.abi,
      provider
    );

    const validTokens = await filterValidTokens(tokenList, provider);

    const result = await contract.getBalances([accountAddress], validTokens);

    return result;
  } catch (error) {
    return `Error to get the balances for chain: ${chain}, ${error}`;
  }
};

export const getNativeBalance = async (
  accountAddress: string,
  chain: string
) => {
  const chainName = () => {
    const chainMapping: Record<Network, string> = {
      ethereum: "mainnet",
      polygon: "polygon-mainnet",
      optimism: "optimism-mainnet",
      arbitrum: "arbitrum-mainnet",
      binance: "bsc-mainnet",
    };

    return chainMapping[chain as Network] || null;
  };

  try {
    const chainUrl = chainName();
    if (!chainUrl) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    const INFURA_URL = `https://${chainUrl}.infura.io/v3/${process.env.REACT_APP_API_KEY}`;

    const provider = new ethers.providers.JsonRpcProvider(INFURA_URL);

    const nativeTokenBalance = await provider.getBalance(accountAddress);

    const balanceInEther = ethers.utils.formatEther(nativeTokenBalance);

    return Number(balanceInEther);
  } catch (error) {
    return `Error to get the native balance for chain: ${chain}, ${error}`;
  }
};

export const getDecimal = async (tokenAddress: string, chain: string) => {
  const chainName = () => {
    const chainMapping: Record<Network, string> = {
      ethereum: "mainnet",
      polygon: "polygon-mainnet",
      optimism: "optimism-mainnet",
      arbitrum: "arbitrum-mainnet",
      binance: "bsc-mainnet",
    };

    return chainMapping[chain as Network] || null;
  };

  try {
    const chainUrl = chainName();
    if (!chainUrl) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    const INFURA_URL = `https://${chainUrl}.infura.io/v3/${process.env.REACT_APP_API_KEY}`;

    // Standard ERC-20 ABI
    const abi = [
      {
        constant: true,
        inputs: [],
        name: "decimals",
        outputs: [
          {
            name: "",
            type: "uint8",
          },
        ],
        payable: false,
        stateMutability: "view",
        type: "function",
      },
    ];

    const provider = new ethers.providers.JsonRpcProvider(INFURA_URL);

    const contract = new ethers.Contract(tokenAddress, abi, provider);

    const result = await contract.decimals();

    return result;
  } catch (error) {
    return `Error to get the balances for chain: ${chain}, ${error}`;
  }
};

export const estimateGas = async (
  tokenAddress: string,
  recipientAddress: string,
  amount: string,
  chain: string
): Promise<string> => {
  const chainName = () => {
    const chainMapping: Record<string, string> = {
      ethereum: "mainnet",
      polygon: "polygon-mainnet",
      optimism: "optimism-mainnet",
      arbitrum: "arbitrum-mainnet",
      binance: "bsc-mainnet",
    };

    return chainMapping[chain] || null;
  };

  console.log("HIHIHI", tokenAddress, recipientAddress, amount, chain);
  try {
    const chainUrl = chainName();
    if (!chainUrl) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    const INFURA_URL = `https://${chainUrl}.infura.io/v3/${process.env.REACT_APP_API_KEY}`;

    // ERC20 token abi from ethers.js
    const abi = [
      // Read-Only Functions
      "function balanceOf(address owner) view returns (uint256)",
      "function decimals() view returns (uint8)",
      "function symbol() view returns (string)",

      // Authenticated Functions
      "function transfer(address to, uint amount) returns (bool)",

      "function transferFrom(address sender, address recipient, uint256 amount) returns (bool)",

      // Events
      "event Transfer(address indexed from, address indexed to, uint amount)",
    ];

    const provider = new ethers.providers.JsonRpcProvider(INFURA_URL);

    const contract = new ethers.Contract(tokenAddress, abi, provider);

    const pk = process.env.REACT_APP_PRIVATE_KEY || "";

    const wallet = new ethers.Wallet(pk, provider);

    const decimals = await contract.decimals();

    const amountInUnits = ethers.utils.parseUnits("1", decimals);

    // Estimate gas
    const gasEstimate = await contract
      .connect(wallet)
      .estimateGas.transfer(recipientAddress, amountInUnits);

    // Get current gas price
    const gasPrice = await provider.getGasPrice();

    // Calculate total cost
    const totalCost = gasEstimate.mul(gasPrice);

    // Convert total cost to readable Native Gas value
    const totalCostInEth = ethers.utils.formatEther(totalCost);

    return totalCostInEth;
  } catch (error) {
    return `Error estimating gas for transfer: ${error}`;
  }
};

// export const transferTokens = async (
//   tokenAddress: string,
//   recipientAddress: string,
//   amount: string,
//   chain: string
// ): Promise<string> => {
//   const chainName = () => {
//     const chainMapping: Record<string, string> = {
//       ethereum: "mainnet",
//       polygon: "polygon-mainnet",
//       optimism: "optimism-mainnet",
//       arbitrum: "arbitrum-mainnet",
//       binance: "bsc-mainnet",
//     };

//     return chainMapping[chain] || null;
//   };

//   console.log("HIHIHI", tokenAddress, recipientAddress, amount, chain);
//   try {
//     const chainUrl = chainName();
//     if (!chainUrl) {
//       throw new Error(`Unsupported chain: ${chain}`);
//     }

//     const INFURA_URL = `https://${chainUrl}.infura.io/v3/facc2b79cf3a4d69a508d34daca25a49`;

//     // ERC20 token abi from ethers.js
//     const abi = [
//       // Read-Only Functions
//       "function balanceOf(address owner) view returns (uint256)",
//       "function decimals() view returns (uint8)",
//       "function symbol() view returns (string)",

//       // Authenticated Functions
//       "function transfer(address to, uint amount) returns (bool)",

//       "function transferFrom(address sender, address recipient, uint256 amount) returns (bool)",

//       // Events
//       "event Transfer(address indexed from, address indexed to, uint amount)",
//     ];

//     const abiPR = await import(
//       "./contracts/artifacts-etherspot-v1/PersonalAccountRegistry.json",
//       {
//         with: { type: "json" },
//       }
//     );

//     const PERSONAL_ACCOUNT_REGISTRY_ADDRESS =
//       "0x7EB3A038F25B9F32f8e19A7F0De83D4916030eFa";

//     const provider = new ethers.providers.JsonRpcProvider(INFURA_URL);

//     const signer = provider.getSigner(
//       "0x19396DE329F9bF5553457956136273c153b62aE4"
//     );

//     console.log("THE SIGNER", signer);
//     const tokenContract = new ethers.Contract(tokenAddress, abi, provider);

//     const accountContract = new ethers.Contract(
//       PERSONAL_ACCOUNT_REGISTRY_ADDRESS,
//       abiPR.default.abi,
//       provider
//     );

//     const pk =
//       "0xf408bbf7a65bc51f12d1663fa318105befc2af27be4127b50f5106f09c734adf";

//     // const iface = new ethers.utils.Interface(abi);

//     // const recipient = "0x3788bb31d134D96399744B7A423066A9258946A2";
//     // const amount = ethers.utils.parseUnits("1.0", 18);

//     // const data = iface.encodeFunctionData("transfer", [recipient, amount]);

//     // console.log("Encoded data:", data);

//     const wallet = new ethers.Wallet(pk, provider);

//     const decimals = await tokenContract.decimals();

//     const amountInUnits = ethers.utils.parseUnits("1", decimals);

//     console.log("prout hihi", recipientAddress, amountInUnits, wallet);

//     const tx = await accountContract
//       .connect(signer)
//       .executeAccountTransaction(
//         "0x19396DE329F9bF5553457956136273c153b62aE4",
//         "0x3788bb31d134D96399744B7A423066A9258946A2",
//         "1",
//         "0x"
//       );

//     const receipt = await tx.wait();

//     return `Transaction successful with hash: ${receipt.transactionHash}`;
//   } catch (error) {
//     return `Error transferring tokens: ${error}`;
//   }
// };

async function connectToSigner() {
  const provider = new ethers.providers.JsonRpcProvider(
    "https://polygon-mainnet.infura.io/v3/facc2b79cf3a4d69a508d34daca25a49"
  );

  const wallet = new ethers.Wallet(
    "0xf408bbf7a65bc51f12d1663fa318105befc2af27be4127b50f5106f09c734adf",
    provider
  );

  return wallet;
}

export const transferTokens = async (
  tokenAddress: string,
  recipientAddress: string,
  amount: string,
  chain: string
) => {
  try {
    const signer = await connectToSigner();
    const personalAccountRegistryAddress =
      "0x7EB3A038F25B9F32f8e19A7F0De83D4916030eFa";

    const abiPR = await import(
      "./contracts/artifacts-etherspot-v1/PersonalAccountRegistry.json",
      {
        with: { type: "json" },
      }
    );

    const personalAccountRegistryContract = new ethers.Contract(
      personalAccountRegistryAddress,
      abiPR.default.abi,
      signer
    );

    // Encode the ERC20 transfer data (using ethers.js ABI encoding)
    const tokenInterface = new ethers.utils.Interface([
      "function transfer(address to, uint256 value) public returns (bool)",
    ]);
    // const tokenInterface = new ethers.utils.Interface([
    //   "function transferFrom(address from, address to, uint256 value) public returns (bool)",
    // ]);
    const data = tokenInterface.encodeFunctionData("transfer", [
      "0x3788bb31d134D96399744B7A423066A9258946A2",
      ethers.utils.parseEther("1"),
    ]);

    const value = ethers.BigNumber.from(0);

    const tx = await personalAccountRegistryContract.executeAccountTransaction(
      "0x19396DE329F9bF5553457956136273c153b62aE4",
      "0xa6b37fC85d870711C56FbcB8afe2f8dB049AE774",
      value,
      data
    );

    await tx.wait();
    console.log("Tokens transferred successfully");
  } catch (error) {
    console.error("Error transferring tokens:", error);
  }
};

// export const transferTokens = async (
//   tokenAddress: string,
//   recipientAddress: string,
//   amount: string,
//   chain: stringc
// ): Promise<string> => {
//   const chainName = () => {
//     const chainMapping: Record<string, string> = {
//       ethereum: "mainnet",
//       polygon: "polygon-mainnet",
//       optimism: "optimism-mainnet",
//       arbitrum: "arbitrum-mainnet",
//       binance: "bsc-mainnet",
//     };

//     return chainMapping[chain] || null;
//   };

//   try {
//     const chainUrl = chainName();
//     if (!chainUrl) {
//       throw new Error(`Unsupported chain: ${chain}`);
//     }

//     const INFURA_URL = `https://${chainUrl}.infura.io/v3/facc2b79cf3a4d69a508d34daca25a49`;

//     // ERC20 token abi from ethers.js
//     const abi = [
//       // Read-Only Functions
//       "function balanceOf(address owner) view returns (uint256)",
//       "function decimals() view returns (uint8)",
//       "function symbol() view returns (string)",

//       // Authenticated Functions
//       "function transfer(address to, uint amount) returns (bool)",

//       "function transferFrom(address sender, address recipient, uint256 amount) returns (bool)",

//       // Events
//       "event Transfer(address indexed from, address indexed to, uint amount)",
//     ];

//     const abiPR = await import(
//       "./contracts/artifacts-etherspot-v1/PersonalAccountRegistry.json",
//       {
//         with: { type: "json" },
//       }
//     );

//     const PERSONAL_ACCOUNT_REGISTRY_ADDRESS =
//       "0x7EB3A038F25B9F32f8e19A7F0De83D4916030eFa";

//     const provider = new ethers.providers.JsonRpcProvider(INFURA_URL);

//     const signer = provider.getSigner(
//       "0x19396DE329F9bF5553457956136273c153b62aE4"
//     );

//     console.log("THE SIGNER", signer);
//     const tokenContract = new ethers.Contract(tokenAddress, abi, provider);

//     const accountContract = new ethers.Contract(
//       PERSONAL_ACCOUNT_REGISTRY_ADDRESS,
//       abiPR.default.abi,
//       provider
//     );

//     const pk =
//       "0xf408bbf7a65bc51f12d1663fa318105befc2af27be4127b50f5106f09c734adf";

//     // const iface = new ethers.utils.Interface(abi);

//     // const recipient = "0x3788bb31d134D96399744B7A423066A9258946A2";
//     // const amount = ethers.utils.parseUnits("1.0", 18);

//     // const data = iface.encodeFunctionData("transfer", [recipient, amount]);

//     // console.log("Encoded data:", data);

//     const wallet = new ethers.Wallet(pk, provider);

//     const decimals = await tokenContract.decimals();

//     const amountInUnits = ethers.utils.parseUnits("1", decimals);

//     console.log("prout hihi", recipientAddress, amountInUnits, wallet);

//     const tx = await accountContract
//       .connect(signer)
//       .executeAccountTransaction(
//         "0x19396DE329F9bF5553457956136273c153b62aE4",
//         "0x3788bb31d134D96399744B7A423066A9258946A2",
//         "1",
//         "0x"
//       );

//     const receipt = await tx.wait();

//     return `Transaction successful with hash: ${receipt.transactionHash}`;
//   } catch (error) {
//     return `Error transferring tokens: ${error}`;
//   }
// };
