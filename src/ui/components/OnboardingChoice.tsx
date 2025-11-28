import { useEffect } from "react";
import { FaWallet, FaKey } from "react-icons/fa";
import { useRecoveryKit } from "../hooks/useRecoveryKit";

const OnboardingChoice = () => {
  const { setOnboardingMethod } = useRecoveryKit();
  const disableSeedPhrase = import.meta.env.VITE_DISABLE_SEED_PHRASE_ONBOARDING === 'true';

  // Auto-select WalletConnect if seed phrase is disabled
  useEffect(() => {
    if (disableSeedPhrase) {
      setOnboardingMethod('wallet-connect');
    }
  }, [disableSeedPhrase, setOnboardingMethod]);

  // If seed phrase is disabled, only show WalletConnect
  if (disableSeedPhrase) {
    return (
      <div className="flex flex-col w-full gap-4">
        <p className="text-md text-left mb-2">
          Connect your wallet to access your account:
        </p>
        <div className="flex justify-center">
          <button
            onClick={() => setOnboardingMethod('wallet-connect')}
            className="flex flex-col items-center gap-3 p-6 border-2 border-[#3C3C53] hover:border-[#A55CD6] rounded-xl transition-colors bg-[#2A2A3E] hover:bg-[#3A3A4E] max-w-md w-full"
          >
            <FaWallet className="text-4xl text-[#A55CD6]" />
            <div className="text-center">
              <p className="font-semibold text-lg">WalletConnect</p>
              <p className="text-sm text-gray-400 mt-1">
                Connect using your mobile wallet
              </p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-4">
      <p className="text-md text-left mb-2">
        Choose how you want to access your account:
      </p>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setOnboardingMethod('seed-phrase')}
          className="flex flex-col items-center gap-3 p-6 border-2 border-[#3C3C53] hover:border-[#A55CD6] rounded-xl transition-colors bg-[#2A2A3E] hover:bg-[#3A3A4E]"
        >
          <FaKey className="text-4xl text-[#A55CD6]" />
          <div className="text-center">
            <p className="font-semibold text-lg">12-Word Seed Phrase</p>
            <p className="text-sm text-gray-400 mt-1">
              Enter your recovery phrase or private key
            </p>
          </div>
        </button>
        <button
          onClick={() => setOnboardingMethod('wallet-connect')}
          className="flex flex-col items-center gap-3 p-6 border-2 border-[#3C3C53] hover:border-[#A55CD6] rounded-xl transition-colors bg-[#2A2A3E] hover:bg-[#3A3A4E]"
        >
          <FaWallet className="text-4xl text-[#A55CD6]" />
          <div className="text-center">
            <p className="font-semibold text-lg">WalletConnect</p>
            <p className="text-sm text-gray-400 mt-1">
              Connect using your mobile wallet
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default OnboardingChoice;

