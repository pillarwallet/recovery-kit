// icons
import { FaRedo } from "react-icons/fa";
import { IoMdReturnLeft } from "react-icons/io";

// css
import "./App.css";
import "./tailwind.css";

// components
import AssetsList from "./components/AssetsList";
import AssetsPerFactory from "./components/AssetsPerFactory";
import ChangeChainMapping from "./components/ChangeChainMapping";
import MnemonicInput from "./components/MnemonicInput";
import TransferToken from "./components/TransferToken";

// hooks
import { useRecoveryKit } from "./hooks/useRecoveryKit";

const App = () => {
  const { step, setStep, accountAddress } = useRecoveryKit();

  const getAppScreen = (screen: number) => {
    switch (screen) {
      case 1:
        return <MnemonicInput />;
      case 2:
        return <AssetsPerFactory contractType="etherspot-v1" />;
      case 3:
        return <AssetsList />;
      case 4:
        return <TransferToken />;
      default:
        return <MnemonicInput />;
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-4xl font-medium">Recovery Kit</h1>
      <ChangeChainMapping />
      {accountAddress && (
        <p className="truncate w-full text-md text-left mb-4">
          Your wallet address:{" "}
          <span className="font-bold">{accountAddress}</span>
        </p>
      )}
      <p className="text-md text-left mb-4">
        Transfer your assets from your{" "}
        <span className="font-bold">Etherspot V1</span> accounts to another
        account.
      </p>
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
