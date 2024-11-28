// constants
import { NATIVE_TOKENS } from "./constants";

export const getNativeTokenSymbol = (chain: ChainType) => {
  return NATIVE_TOKENS[chain];
};

export const getBlockScan = (chain: ChainType) => {
  switch (chain) {
    case "ethereum":
      return "https://etherscan.io/tx/";
    case "polygon":
      return "https://polygonscan.com/tx/";
    case "binance":
      return "https://bscscan.com/tx/";
    case "xdai":
      return "https://gnosisscan.io/tx/";
    case "optimism":
      return "https://optimistic.etherscan.io/tx/";
    case "arbitrum":
      return "https://arbiscan.io/tx/";
    default:
      return "";
  }
};

export const allNativeTokens: Record<
  Network,
  { name: string; symbol: string }
> = {
  ethereum: { name: "Ether", symbol: "ETH" },
  polygon: { name: "MATIC", symbol: "MATIC" },
  optimism: { name: "Ether", symbol: "ETH" },
  arbitrum: { name: "Ether", symbol: "ETH" },
  xdai: { name: "xDai", symbol: "XDAI" },
  binance: { name: "Binance Coin", symbol: "BNB" },
};
