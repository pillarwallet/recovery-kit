type ChainType =
  | "ethereum"
  | "polygon"
  | "binance"
  | "xdai"
  | "optimism"
  | "arbitrum";

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
  statistics: Statistics;
  getStaticData: StaticData;
  changeView: View;
  sendFrameAction: FrameWindowAction;
  submitMnemonic: any;
  getBalances: any;
};

type UnsubscribeFunction = () => void;

interface Window {
  electron: {
    subscribeStatistics: (
      callback: (statistics: Statistics) => void
    ) => UnsubscribeFunction;
    getStaticData: () => Promise<StaticData>;
    subscribeChangeView: (
      callback: (view: View) => void
    ) => UnsubscribeFunction;
    sendFrameAction: (payload: FrameWindowAction) => void;
    submitMnemonic: (mnemonicWords: string[]) => Promise<any>;
    getBalances: (
      accountAddress: string,
      tokenList: string[],
      chain: string
    ) => Promise<any>;
    getNativeBalance: (accountAddress: string, chain: string) => Promise<any>;
    getDecimal: (tokenAddress: string, chain: string) => Promise<any>;
    estimateGas: (
      tokenAddress: string,
      recipientAddress: string,
      amount: string,
      chain: string
    ) => Promise<any>;
    transferTokens: (
      tokenAddress: string,
      recipientAddress: string,
      amount: string,
      chain: string
    ) => Promise<any>;
  };
}

type Network = "ethereum" | "polygon" | "optimism" | "arbitrum" | "binance";

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
  chain: string;
  tokenAddress: string;
  balance: number;
};
