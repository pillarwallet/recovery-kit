import { mainnet, polygon, optimism, arbitrum, bsc, gnosis, base } from 'wagmi/chains'
import type { Chain } from 'wagmi/chains'

export const getChainFromName = (chainName: string): Chain => {
  switch (chainName.toLowerCase()) {
    case 'ethereum':
      return mainnet
    case 'polygon':
      return polygon
    case 'optimism':
      return optimism
    case 'arbitrum':
      return arbitrum
    case 'binance':
      return bsc
    case 'xdai':
      return gnosis
    case 'base':
      return base
    default:
      return mainnet
  }
}

export const getChainId = (chainName: string): number => {
  return getChainFromName(chainName).id
}

