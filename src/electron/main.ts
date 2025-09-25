import dotenv from "dotenv";
import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { getPreloadPath } from "./pathResolver.js";
import {
  estimateGas,
  estimateGasNftTransfer,
  getAccountAddress,
  getArchanovaAddress,
  getBalances,
  estimateArchanovaDeploymentCost,
  deployArchanovaContract,
  getCode,
  getDecimal,
  getEOAAddress,
  getNativeBalance,
  getNftBalance,
  getNftName,
  getPrivateKey,
  submitMnemonic,
  transferNft,
  transferTokens,
} from "./resourceManager.js";

// utils
import { ipcMainOn, isDev } from "./utils.js";

// Load .env file
dotenv.config();

let chainMapping = {
  polygon: "https://polygon-rpc.com",
  optimism: "https://optimism-rpc.publicnode.com",
  arbitrum: "https://arb1.arbitrum.io/rpc",
  binance: "https://bsc-dataseed1.binance.org",
  ethereum: "https://ethereum-rpc.publicnode.com",
  xdai: "https://rpc.gnosischain.com",
};

app.on("ready", () => {
  const mainWindow = new BrowserWindow({
    width: 680,
    webPreferences: {
      preload: getPreloadPath(),
    },
  });

  if (isDev()) {
    mainWindow.loadURL("http://localhost:5123");
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), "/dist-react/index.html"));
  }

  // Listen for the updated chain mapping
  ipcMainOn("updateChainMapping", (updatedChainMapping) => {
    chainMapping = updatedChainMapping;
    console.log("Updated Chain Mapping in Main Process:", chainMapping);
  });

  // Handle getting the EAO address
  ipcMain.handle("getEOAAddress", async (_, privateKey) => {
    try {
      const EOAAddress = await getEOAAddress(privateKey);
      return EOAAddress;
    } catch (error) {
      return `Error, ${error}`;
    }
  });

  // Handle getting the account address
  ipcMain.handle("getAccountAddress", async (_, privateKey) => {
    try {
      const accountAddress = await getAccountAddress(privateKey);
      return accountAddress;
    } catch (error) {
      return `Error, ${error}`;
    }
  });

  // Handle getting the Archanova account address
  ipcMain.handle("getArchanovaAddress", async (_, privateKey) => {
    try {
      const accountAddress = await getArchanovaAddress(privateKey);
      return accountAddress;
    } catch (error) {
      return `Error, ${error}`;
    }
  });

  // Handle the mnemonic from the frontend
  ipcMain.handle("submitMnemonic", async (_, mnemonicWords: string[]) => {
    try {
      const result: string = await submitMnemonic(mnemonicWords);
      return result;
    } catch (error) {
      return `Error, ${error}`;
    }
  });

  // Handle getting the Private Key
  ipcMain.handle("getPrivateKey", async (_, mnemonicWords) => {
    try {
      const privateKeyResult = await getPrivateKey(mnemonicWords);
      return privateKeyResult;
    } catch (error) {
      return `Error, ${error}`;
    }
  });

  // Handle getting contract code
  ipcMain.handle("getCode", async (_, address, chain) => {
    try {
      const code = await getCode(address, chain);
      return code;
    } catch (error) {
      return `Error, ${error}`;
    }
  });

  // Handle estimating Archanova deployment cost
  ipcMain.handle("estimateArchanovaDeploymentCost", async (_, chain, privateKey, archanovaAddress) => {
    try {
      const cost = await estimateArchanovaDeploymentCost(chain, privateKey, archanovaAddress);
      return cost;
    } catch (error) {
      return `Error, ${error}`;
    }
  });

  // Handle deploying Archanova contract
  ipcMain.handle("deployArchanovaContract", async (_, chain, privateKey, archanovaAddress) => {
    try {
      const txHash = await deployArchanovaContract(chain, privateKey, archanovaAddress);
      return txHash;
    } catch (error) {
      return `Error, ${error}`;
    }
  });

  // Handle all balances in the tokens lists
  ipcMain.handle(
    "getBalances",
    async (_, accountAddress: string, tokenList: string[], chain: string) => {
      try {
        const balances = await getBalances(accountAddress, tokenList, chain);

        // Convert BigInt values to strings
        const readableBalances = balances.map((balance: bigint) =>
          balance.toString()
        );

        return readableBalances;
      } catch (error) {
        return `Error, ${error}`;
      }
    }
  );

  // Handle nft name
  ipcMain.handle("getNftName", async (_, nftAddress, chain) => {
    try {
      const nftName = await getNftName(nftAddress, chain);

      return nftName;
    } catch (error) {
      return `Error, ${error}`;
    }
  });

  // Handle nft balance for compatible chain ids
  ipcMain.handle(
    "getNftBalance",
    async (_, accountAddress, nftAddress, nftId, chain) => {
      try {
        const nftBalance = await getNftBalance(
          accountAddress,
          nftAddress,
          nftId,
          chain
        );

        return nftBalance;
      } catch (error) {
        return `Error, ${error}`;
      }
    }
  );

  // Handle native balances for compatible chain ids
  ipcMain.handle("getNativeBalance", async (_, accountAddress, chain) => {
    try {
      const nativeBalance = await getNativeBalance(accountAddress, chain);

      return nativeBalance;
    } catch (error) {
      return `Error, ${error}`;
    }
  });

  // Handle getting the right decimals for tokens
  ipcMain.handle("getDecimal", async (_, tokenAddress, chain) => {
    try {
      const decimal = await getDecimal(tokenAddress, chain);

      return decimal;
    } catch (error) {
      return `Error, ${error}`;
    }
  });

  // Handle the gas estimation
  ipcMain.handle(
    "estimateGas",
    async (
      _,
      accountAddress,
      tokenAddress,
      recipientAddress,
      amount,
      chain,
      privateKey,
      contractType: ContractsType
    ) => {
      try {
        const estimatedGas = await estimateGas(
          accountAddress,
          tokenAddress,
          recipientAddress,
          amount,
          chain,
          privateKey,
          contractType
        );

        return estimatedGas;
      } catch (error) {
        return `Error, ${error}`;
      }
    }
  );

  // Handle the gas estimation for nft transfer
  ipcMain.handle(
    "estimateGasNftTransfer",
    async (_, accountAddress, recipientAddress, nftAddress, nftId, chain) => {
      try {
        const estimatedGas = await estimateGasNftTransfer(
          accountAddress,
          recipientAddress,
          nftAddress,
          nftId,
          chain
        );

        return estimatedGas;
      } catch (error) {
        return `Error, ${error}`;
      }
    }
  );

  // Handle the token transfers
  ipcMain.handle(
    "transferTokens",
    async (
      _,
      accountAddress,
      tokenAddress,
      recipientAddress,
      amount,
      chain,
      privateKey,
      contractType: ContractsType
    ) => {
      try {
        const tx = await transferTokens(
          accountAddress,
          tokenAddress,
          recipientAddress,
          amount,
          chain,
          privateKey,
          contractType
        );

        return tx;
      } catch (error) {
        return `Error, ${error}`;
      }
    }
  );

  // Handle the nft transfers
  ipcMain.handle(
    "transferNft",
    async (
      _,
      accountAddress,
      recipientAddress,
      nftAddress,
      nftId,
      chain,
      privateKey,
      contractType: ContractsType
    ) => {
      try {
        const tx = await transferNft(
          accountAddress,
          recipientAddress,
          nftAddress,
          nftId,
          chain,
          privateKey,
          contractType
        );

        return tx;
      } catch (error) {
        return `Error, ${error}`;
      }
    }
  );
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Expose the chain mapping for other Node.js files to use
export { chainMapping };
