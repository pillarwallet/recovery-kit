import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider as WagmiProviderBase } from 'wagmi'
import { config } from '../config/wagmi'
import { ReactNode } from 'react'

const queryClient = new QueryClient()

interface WagmiProviderProps {
  children: ReactNode
}

export const WagmiProvider = ({ children }: WagmiProviderProps) => {
  return (
    <WagmiProviderBase config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProviderBase>
  )
}

