const electron = require("electron");

electron.contextBridge.exposeInMainWorld("electron", {
  updateChainMapping: (updatedChainMapping: any) =>
    ipcSend("updateChainMapping", updatedChainMapping),
  getEOAAddress: (privateKey: string) =>
    ipcInvoke("getEOAAddress", [privateKey]),
  getAccountAddress: (privateKey: string) =>
    ipcInvoke("getAccountAddress", [privateKey]),
  getArchanovaAddress: (privateKey: string) =>
    ipcInvoke("getArchanovaAddress", [privateKey]),
  submitMnemonic: (mnemonicWords: string[]) =>
    ipcInvoke("submitMnemonic", [mnemonicWords]),
  getPrivateKey: (mnemonicWords: string[]) =>
    ipcInvoke("getPrivateKey", [mnemonicWords]),
  getCode: (address: string, chain: string) =>
    ipcInvoke("getCode", [address, chain]),
  estimateArchanovaDeploymentCost: (chain: string, privateKey: string, archanovaAddress: string) =>
    ipcInvoke("estimateArchanovaDeploymentCost", [chain, privateKey, archanovaAddress]),
  deployArchanovaContract: (chain: string, privateKey: string, archanovaAddress: string) =>
    ipcInvoke("deployArchanovaContract", [chain, privateKey, archanovaAddress]),
  getBalances: (accountAddress: string, tokenList: string[], chain: string) =>
    ipcInvoke("getBalances", [accountAddress, tokenList, chain]),
  getNftName: (nftAddress: string, chain: string) =>
    ipcInvoke("getNftName", [nftAddress, chain]),
  getNftBalance: (
    accountAddress: string,
    nftAddress: string,
    nftId: string,
    chain: string
  ) => ipcInvoke("getNftBalance", [accountAddress, nftAddress, nftId, chain]),
  getNativeBalance: (accountAddress: string, chain: string) =>
    ipcInvoke("getNativeBalance", [accountAddress, chain]),
  getDecimal: (tokenAddress: string, chain: string) =>
    ipcInvoke("getDecimal", [tokenAddress, chain]),
  estimateGas: (
    accountAddress: string,
    tokenAddress: string,
    recipientAddress: string,
    amount: string,
    chain: string,
    privateKey: string,
    contractType: ContractsType
  ) =>
    ipcInvoke("estimateGas", [
      accountAddress,
      tokenAddress,
      recipientAddress,
      amount,
      chain,
      privateKey,
      contractType,
    ]),
  estimateGasNftTransfer: (
    accountAddress: string,
    recipientAddress: string,
    nftAddress: string,
    nftId: string,
    chain: string
  ) =>
    ipcInvoke("estimateGasNftTransfer", [
      accountAddress,
      recipientAddress,
      nftAddress,
      nftId,
      chain,
    ]),
  transferTokens: (
    accountAddress: string,
    tokenAddress: string,
    recipientAddress: string,
    amount: string,
    chain: string,
    privateKey: string,
    contractType: ContractsType
  ) =>
    ipcInvoke("transferTokens", [
      accountAddress,
      tokenAddress,
      recipientAddress,
      amount,
      chain,
      privateKey,
      contractType,
    ]),
  transferNft: (
    accountAddress: string,
    recipientAddress: string,
    nftAddress: string,
    nftId: string,
    chain: string,
    privateKey: string,
    contractType: ContractsType
  ) =>
    ipcInvoke("transferNft", [
      accountAddress,
      recipientAddress,
      nftAddress,
      nftId,
      chain,
      privateKey,
      contractType,
    ]),
} satisfies Window["electron"]);

export function ipcInvoke<Key extends keyof EventPayloadMapping>(
  key: Key,
  args?: any[]
): Promise<EventPayloadMapping[Key]> {
  return electron.ipcRenderer.invoke(key, ...(args || []));
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
