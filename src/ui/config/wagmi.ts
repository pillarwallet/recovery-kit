import { createConfig, http } from 'wagmi'
import { mainnet, polygon, optimism, arbitrum, bsc, gnosis } from 'wagmi/chains'
import { walletConnect } from '@wagmi/connectors'

// Get WalletConnect project ID from environment or use a default
// You should get your own project ID from https://cloud.walletconnect.com
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'default-project-id'

export const config = createConfig({
  chains: [mainnet, polygon, optimism, arbitrum, bsc, gnosis],
  connectors: [
    walletConnect({
      projectId,
      showQrModal: true,
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [bsc.id]: http(),
    [gnosis.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}

