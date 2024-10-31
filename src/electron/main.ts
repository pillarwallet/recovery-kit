import { app, BrowserWindow, ipcMain } from "electron";
import { BigNumber } from "ethers";
import path from "path";
import { getPreloadPath } from "./pathResolver.js";
import {
  estimateGas,
  getBalances,
  getDecimal,
  getNativeBalance,
  getStaticData,
  submitMnemonic,
  transferTokens,
} from "./resourceManager.js";
import { isDev } from "./util.js";

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

  // pollResources(mainWindow);

  ipcMain.handle("getStaticData", () => {
    return getStaticData();
  });

  // Handle the mnemonic from the frontend
  ipcMain.handle("submitMnemonic", async (_, mnemonicWords) => {
    console.log("Received Mnemonic Words:", mnemonicWords);
    const result = await submitMnemonic(mnemonicWords); // Process mnemonic
    return result; // Return the result to the frontend
  });
  // ipcMain.handle("getBalances", async (_, accountAddress, tokenList) => {
  //   const result = await getBalances(accountAddress, tokenList); // Process mnemonic
  //   return result; // Return the result to the frontend
  // });

  ipcMain.handle("getBalances", async (_, accountAddress, tokenList, chain) => {
    try {
      // Assume getBalancesForAddress is a function that returns the uint256[] array
      const balances = await getBalances(accountAddress, tokenList, chain);

      console.log("balances", balances); // This will log BigInt values like [0n, ...]

      // Convert BigInt values to strings to make them serializable
      const serializableBalances = balances.map((balance: BigNumber) =>
        balance.toString()
      );

      console.log("serializableBalances", serializableBalances);

      return serializableBalances; // Now we return serializable string values
    } catch (error) {
      return console.log("Error", error);
    }
  });

  ipcMain.handle("getNativeBalance", async (_, accountAddress, chain) => {
    try {
      // Assume getBalancesForAddress is a function that returns the uint256[] array
      const nativeBalance = await getNativeBalance(accountAddress, chain);

      console.log("nativeBalance", nativeBalance); // This will log BigInt values like [0n, ...]

      return nativeBalance; // Now we return serializable string values
    } catch (error) {
      return console.log("Error", error);
    }
  });

  ipcMain.handle("getDecimal", async (_, tokenAddress, chain) => {
    try {
      // Assume getBalancesForAddress is a function that returns the uint256[] array
      const decimal = await getDecimal(tokenAddress, chain);

      console.log("decimal", decimal);

      return decimal;
    } catch (error) {
      return console.log("Error", error);
    }
  });

  ipcMain.handle(
    "estimateGas",
    async (_, tokenAddress, recipientAddress, amount, chain) => {
      try {
        const estimatedGas = await estimateGas(
          tokenAddress,
          recipientAddress,
          amount,
          chain
        );

        console.log("estimatedGas", estimatedGas);

        return estimatedGas;
      } catch (error) {
        return console.log("Error", error);
      }
    }
  );
  ipcMain.handle(
    "transferTokens",
    async (_, tokenAddress, recipientAddress, amount, chain) => {
      try {
        const tx = await transferTokens(
          tokenAddress,
          recipientAddress,
          amount,
          chain
        );

        console.log("transferTokens", tx);

        return tx;
      } catch (error) {
        return console.log("Error", error);
      }
    }
  );
});
