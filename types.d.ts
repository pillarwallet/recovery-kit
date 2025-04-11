/* eslint-disable @typescript-eslint/no-explicit-any */
type ChainType =
  | "ethereum"
  | "polygon"
  | "binance"
  | "xdai"
  | "optimism"
  | "arbitrum";

type ContractsType = "etherspot-v1" | "archanova";

type Statistics = {
  cpuUsage: number;
  ramUsage: number;
  storageUsage: number;
};

type StaticData = {
  totalStorage: number;
  cpuModel: string;
  totalMemoryGB: number;
};

type View = "CPU" | "RAM" | "STORAGE";

type FrameWindowAction = "CLOSE" | "MAXIMIZE" | "MINIMIZE";

type EventPayloadMapping = {
  updateChainMapping: any;
  getEOAAddress: string;
  getAccountAddress: string;
  submitMnemonic: string;
  getBalances: bigint[];
  getNftName: string | undefined;
  getNftBalance: number;
  getNativeBalance: string;
  getDecimal: string | number;
  estimateGas: string;
  estimateGasNftTransfer: string;
  transferTokens: string;
  transferNft: string;
  getPrivateKey: string;
};

type UnsubscribeFunction = () => void;

interface Window {
  electron: {
    updateChainMapping: (updatedChainMapping: any) => void;
    getEOAAddress: (privateKey: string) => Promise<string>;
    getAccountAddress: (privateKey: string) => Promise<string>;
    submitMnemonic: (mnemonicWords: string[]) => Promise<string>;
    getPrivateKey: (mnemonicWords: string[]) => Promise<string>;
    getBalances: (
      accountAddress: string,
      tokenList: string[],
      chain: string
    ) => Promise<bigint[]>;
    getNftName: (
      nftAddress: string,
      chain: string
    ) => Promise<string | undefined>;
    getNftBalance: (
      accountAddress: string,
      nftAddress: string,
      nftId: string,
      chain: string
    ) => Promise<number>;
    getNativeBalance: (
      accountAddress: string,
      chain: string
    ) => Promise<string>;
    getDecimal: (
      tokenAddress: string,
      chain: string
    ) => Promise<string | number>;
    estimateGas: (
      accountAddress: string,
      tokenAddress: string,
      recipientAddress: string,
      amount: string,
      chain: string,
      privateKey: string
    ) => Promise<string>;
    estimateGasNftTransfer: (
      accountAddress: string,
      recipientAddress: string,
      nftAddress: string,
      nftId: string,
      chain: string
    ) => Promise<string>;
    transferTokens: (
      accountAddress: string,
      tokenAddress: string,
      recipientAddress: string,
      amount: string,
      chain: string,
      privateKey: string
    ) => Promise<string>;
    transferNft: (
      accountAddress: string,
      recipientAddress: string,
      nftAddress: string,
      nftId: string,
      chain: string,
      privateKey: string
    ) => Promise<string>;
  };
}

type Network =
  | "ethereum"
  | "polygon"
  | "optimism"
  | "arbitrum"
  | "xdai"
  | "binance";

type TokenList = {
  address: string;
  chainId: number;
  decimals: string;
  name: string;
  symbol: string;
  logoURI: string;
};

type BalanceInfo = {
  type?: "BalanceInfo";
  name: string;
  chain: string;
  address: string;
  decimals: number;
  symbol: string;
  logoURI: string;
  balance: string;
};

type BalancesByChain = {
  [chain: string]: BalanceInfo[];
};

type AddedAssets = {
  type?: "AddedAsset";
  assetType: "token" | "nft";
  tokenId?: string;
  chain: string;
  tokenAddress: string;
  balance: string;
};
