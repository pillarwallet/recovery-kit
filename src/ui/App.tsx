// icons
import { FaRedo, FaArrowRight, FaPlusCircle, FaExternalLinkAlt } from "react-icons/fa";
import { IoMdReturnLeft } from "react-icons/io";
import { IoWarningOutline } from "react-icons/io5";

// css
import "./App.css";
import "./tailwind.css";

// components
import AssetsList from "./components/AssetsList";
import AssetsPerFactory from "./components/AssetsPerFactory";
import ChangeChainMapping from "./components/ChangeChainMapping";
import ConnectWallet from "./components/ConnectWallet";
import MnemonicInput from "./components/MnemonicInput";
import OnboardingChoice from "./components/OnboardingChoice";
import TransferToken from "./components/TransferToken";

// hooks
import { useRecoveryKit } from "./hooks/useRecoveryKit";
import { useArchanovaAddress } from "./hooks/useRecoveryKit";
import { useAccount, useDisconnect } from "wagmi";

const App = () => {
  const { step, setStep, accountAddress, EOAWalletAddress, onboardingMethod, setOnboardingMethod, setEOAWalletAddress } = useRecoveryKit();
  const archanovaAddress = useArchanovaAddress();
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const getAppScreen = (screen: number) => {
    const disableSeedPhrase = import.meta.env.VITE_DISABLE_SEED_PHRASE_ONBOARDING === 'true';
    
    switch (screen) {
      case 1:
        // Show onboarding choice if no method selected, otherwise show the selected method
        if (!onboardingMethod) {
          return <OnboardingChoice />;
        }
        if (onboardingMethod === 'seed-phrase') {
          // Don't show seed phrase input if it's disabled
          if (disableSeedPhrase) {
            return <OnboardingChoice />;
          }
          return <MnemonicInput />;
        }
        if (onboardingMethod === 'wallet-connect') {
          return <ConnectWallet />;
        }
        return <OnboardingChoice />;
      case 2:
        return <>
          <AssetsPerFactory contractType="etherspot-v1" />
          <AssetsPerFactory contractType="archanova" />
        </>
      case 3:
        return <AssetsList />;
      case 4:
        return <TransferToken />;
      default:
        return <OnboardingChoice />;
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-4xl font-medium"><FaPlusCircle className="inline mr-0 mb-2" /> Recovery Kit</h1>
      <p className="text-xs text-left mt-[-15px] ml-11">
        For Etherspot and Pillar Wallet users
      </p>
      <ChangeChainMapping />
      <p className="text-md text-left mb-0">
        Etherspot Recovery Kit is a tool to help you recover your assets from your Etherspot V1 and Archanova accounts. This tool talks directly to your account on the blockchain.
      </p>

      <div className="flex gap-3 items-start p-4 bg-amber-200 border-l-4 border-amber-400 rounded-r-lg">
        <IoWarningOutline className="text-amber-900 text-xl flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-left text-amber-700">
            As Etherspot V1 and Archanova servers are permanently unavailable, all gas fees
            must be paid via your EOA Wallet. Please ensure it has sufficient
            funds.
          </p>
        </div>
      </div>

      {step > 1 && (
        <>
          {onboardingMethod === 'wallet-connect' && isConnected && (
            <div className="flex items-center gap-3 w-full mb-2">
              <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-green-100 border border-green-400 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-sm text-green-800">Wallet Connected</p>
              </div>
              <button
                onClick={() => {
                  if (isConnected) {
                    disconnect();
                  }
                  setOnboardingMethod(null);
                  setEOAWalletAddress(null);
                  setStep(1);
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors"
              >
                Disconnect Wallet
              </button>
            </div>
          )}
          {EOAWalletAddress && (
            <p className="truncate w-full text-md text-left mb-[-10px]">
              Your <span className="font-bold">EOA Wallet </span>address:{" "}
              <span className="font-bold font-mono">{EOAWalletAddress}</span>
              <FaExternalLinkAlt className="inline mb-1 ml-5 mr-1" /> 
              <a href={`https://etherscan.io/address/${EOAWalletAddress}#asset-multichain`} target="_blank" rel="noopener noreferrer">View on block explorer</a>
            </p>
          )}
          {archanovaAddress && (
              <p className="truncate w-full text-md text-left mb-[-10px] ml-3">
                <FaArrowRight className="inline mr-1" /> Your <span className="font-bold">Archanova </span>address:{" "}
                <span className="font-bold font-mono">{archanovaAddress}</span>
                <FaExternalLinkAlt className="inline mb-1 ml-5 mr-1" /> 
                <a href={`https://etherscan.io/address/${archanovaAddress}#asset-multichain`} target="_blank" rel="noopener noreferrer">View on block explorer</a>
              </p>
          )}
          {accountAddress && (
            <p className="truncate w-full text-md text-left ml-3">
              <FaArrowRight className="inline mr-1" /> Your <span className="font-bold">Etherspot V1 </span>address:{" "}
              <span className="font-bold font-mono">{accountAddress}</span>
              <FaExternalLinkAlt className="inline mb-1 ml-5 mr-1" /> 
              <a href={`https://etherscan.io/address/${accountAddress}#asset-multichain`} target="_blank" rel="noopener noreferrer">View on block explorer</a>
            </p>
          )}
        </>
      )}

      <div className="flex w-full justify-between">
        {step !== 1 && (
          <button
            onClick={handlePrevious}
            className="flex items-center gap-2 hover:bg-[#B578DD] border border-[#3C3C53] px-6 py-2 rounded-xl text-white"
          >
            <IoMdReturnLeft size={20} />
            <p>Previous</p>
          </button>
        )}
        {step === 3 && (
          <button
            onClick={() => setStep(2)}
            className="flex items-center gap-2 hover:bg-[#B578DD] border border-[#3C3C53] px-6 py-2 rounded-xl text-white"
          >
            <p>Update assets balances</p>
            <FaRedo size={20} />
          </button>
        )}
      </div>

      {getAppScreen(step)}
    </div>
  );
};

export default App;
