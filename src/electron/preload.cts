import { ipcRenderer } from "electron";

const electron = require("electron");

electron.contextBridge.exposeInMainWorld("electron", {
  subscribeStatistics: (callback) =>
    ipcOn("statistics", (stats) => {
      callback(stats);
    }),
  subscribeChangeView: (callback) =>
    ipcOn("changeView", (view) => {
      callback(view);
    }),
  getStaticData: () => ipcInvoke("getStaticData"),
  sendFrameAction: (payload) => ipcSend("sendFrameAction", payload),
  submitMnemonic: (mnemonicWords: string[]) =>
    ipcRenderer.invoke("submitMnemonic", mnemonicWords),
  getBalances: (accountAddress: string, tokenList: string[], chain: string) =>
    ipcRenderer.invoke("getBalances", accountAddress, tokenList, chain),
  getNativeBalance: (accountAddress: string, chain: string) =>
    ipcRenderer.invoke("getNativeBalance", accountAddress, chain),
  getDecimal: (tokenAddress: string, chain: string) =>
    ipcRenderer.invoke("getDecimal", tokenAddress, chain),
  estimateGas: (
    tokenAddress: string,
    recipientAddress: string,
    amount: string,
    chain: string
  ) =>
    ipcRenderer.invoke(
      "estimateGas",
      tokenAddress,
      recipientAddress,
      amount,
      chain
    ),
  transferTokens: (
    tokenAddress: string,
    recipientAddress: string,
    amount: string,
    chain: string
  ) =>
    ipcRenderer.invoke(
      "transferTokens",
      tokenAddress,
      recipientAddress,
      amount,
      chain
    ),
} satisfies Window["electron"]);

function ipcInvoke<Key extends keyof EventPayloadMapping>(
  key: Key,
  args?: any[]
): Promise<EventPayloadMapping[Key]> {
  return electron.ipcRenderer.invoke(key, args);
}

function ipcOn<Key extends keyof EventPayloadMapping>(
  key: Key,
  callback: (payload: EventPayloadMapping[Key]) => void
) {
  const cb = (_: Electron.IpcRendererEvent, payload: any) => callback(payload);
  electron.ipcRenderer.on(key, cb);
  return () => electron.ipcRenderer.off(key, cb);
}

function ipcSend<Key extends keyof EventPayloadMapping>(
  key: Key,
  payload: EventPayloadMapping[Key]
) {
  electron.ipcRenderer.send(key, payload);
}
