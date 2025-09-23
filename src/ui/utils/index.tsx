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
  polygon: { name: "POL", symbol: "POL" },
  optimism: { name: "Ether", symbol: "ETH" },
  arbitrum: { name: "Ether", symbol: "ETH" },
  xdai: { name: "xDai", symbol: "XDAI" },
  binance: { name: "Binance Coin", symbol: "BNB" },
};

/**
 * Centralized address selection logic based on contract type
 * This allows for easy extension when new contract types are added
 */
export const getAddressForContractType = (
  contractType: ContractsType,
  addresses: {
    accountAddress: string | null;
    archanovaAddress: string | null;
    EOAWalletAddress: string | null;
  }
): string | null => {
  switch (contractType) {
    case "etherspot-v1":
      return addresses.accountAddress;
    case "archanova":
      return addresses.archanovaAddress;
    default:
      // Fallback to account address for unknown contract types
      console.warn(`Unknown contract type: ${contractType}, falling back to account address`);
      return addresses.accountAddress;
  }
};
