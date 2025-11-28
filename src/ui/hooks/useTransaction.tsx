import { useWalletClient, usePublicClient } from 'wagmi'
import { useRecoveryKit } from './useRecoveryKit'
import { getChainFromName } from '../utils/transactions'
import { createPublicClient, createWalletClient, http, encodeFunctionData, parseUnits, getContract } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import type { Chain } from 'wagmi/chains'

// Import ABIs - these would need to be available in the UI
// For now, we'll use a hybrid approach

export const useTransactionProvider = () => {
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const { onboardingMethod, seedPhrase, EOAWalletAddress } = useRecoveryKit()

  const getProvider = async (chainName: string) => {
    const chain = getChainFromName(chainName)
    
    if (onboardingMethod === 'wallet-connect' && walletClient) {
      // Use WalletConnect wallet client
      return {
        walletClient,
        publicClient: publicClient || createPublicClient({
          chain,
          transport: http(),
        }),
        account: walletClient.account,
        useWalletConnect: true,
      }
    } else {
      // Use private key (fallback or seed phrase onboarding)
      const privateKey = await window.electron.getPrivateKey(seedPhrase)
      const account = privateKeyToAccount(privateKey as `0x${string}`)
      
      return {
        walletClient: createWalletClient({
          chain,
          transport: http(),
          account,
        }),
        publicClient: createPublicClient({
          chain,
          transport: http(),
        }),
        account,
        useWalletConnect: false,
      }
    }
  }

  return { getProvider, isWalletConnect: onboardingMethod === 'wallet-connect' && !!walletClient }
}

