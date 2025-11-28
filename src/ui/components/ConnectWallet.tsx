import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useEffect, useState } from 'react'
import { FaWallet } from 'react-icons/fa'
import type { Connector } from 'wagmi'
import { useRecoveryKit } from '../hooks/useRecoveryKit'

const ConnectWallet = () => {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { 
    onboardingMethod, 
    setEOAWalletAddress, 
    setStep, 
    setOnboardingMethod,
    setArchanovaAddress,
    setAccountAddress
  } = useRecoveryKit()
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false)

  const walletConnectConnector = connectors.find(
    (connector: Connector) => connector.id === 'walletConnect'
  )

  // When wallet connects via WalletConnect onboarding, set the address and derive Archanova/Etherspot addresses
  useEffect(() => {
    const deriveAddresses = async () => {
      if (onboardingMethod === 'wallet-connect' && isConnected && address) {
        setIsLoadingAddresses(true)
        setEOAWalletAddress(address)
        
        try {
          // Derive Archanova address from EOA address
          const archanova = await window.electron.getArchanovaAddressFromEOA(address)
          if (archanova && !archanova.includes("Error") && archanova.includes("0x") && archanova !== 'no address found') {
            setArchanovaAddress(archanova)
          } else {
            setArchanovaAddress(null)
          }

          // Derive Etherspot V1 address from EOA address
          const etherspot = await window.electron.getEtherspotAddressFromEOA(address)
          if (etherspot && !etherspot.includes("Error") && etherspot.includes("0x")) {
            setAccountAddress(etherspot)
          } else {
            setAccountAddress(null)
          }
        } catch (error) {
          console.error('Error deriving addresses:', error)
          setArchanovaAddress(null)
          setAccountAddress(null)
        } finally {
          setIsLoadingAddresses(false)
          setStep(2)
        }
      }
    }

    deriveAddresses()
  }, [onboardingMethod, isConnected, address, setEOAWalletAddress, setStep, setArchanovaAddress, setAccountAddress])

  // Only show this component if wallet-connect onboarding method is selected
  if (onboardingMethod !== 'wallet-connect') {
    return null
  }

  return (
    <div className="flex flex-col w-full gap-4">
      <button
        onClick={() => {
          if (isConnected) {
            disconnect()
          }
          setOnboardingMethod(null)
        }}
        className="self-start text-sm text-gray-400 hover:text-white transition-colors"
      >
        ← Choose different method
      </button>
      {isConnected && address ? (
        <div className="flex items-center gap-3 p-4 bg-green-100 border border-green-400 rounded-lg">
          <FaWallet className="text-green-700" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-800">
              {isLoadingAddresses ? 'Deriving addresses...' : 'Wallet Connected'}
            </p>
            <p className="text-xs text-green-700 font-mono truncate">{address}</p>
          </div>
          <button
            onClick={() => {
              disconnect()
              setOnboardingMethod(null)
              setEOAWalletAddress(null)
              setArchanovaAddress(null)
              setAccountAddress(null)
              setStep(1)
            }}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors"
            disabled={isLoadingAddresses}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <FaWallet className="text-blue-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-800">Connect Wallet</p>
            <p className="text-xs text-blue-600">
              Connect your wallet using WalletConnect to access your account
            </p>
          </div>
          {walletConnectConnector && (
            <button
              onClick={() => connect({ connector: walletConnectConnector })}
              disabled={isPending}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {isPending ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default ConnectWallet

