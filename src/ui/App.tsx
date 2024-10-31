import { useEffect } from "react";
import { IoMdReturnLeft } from "react-icons/io";
import "./App.css";
import AssetsList from "./components/AssetsList";
import AssetsPerFactory from "./components/AssetsPerFactory";
import MnemonicInput from "./components/MnemonicInput";
import TransferToken from "./components/TransferToken";
import { useRecoveryKit } from "./hooks/useRecoveryKit";
import "./tailwind.css";

const App = () => {
  const { step, setStep } = useRecoveryKit();
  useEffect(() => {
    window.electron.subscribeStatistics((stats) => console.log(stats));
  }, []);

  const getAppScreen = (screen: number) => {
    switch (screen) {
      case 1:
        return <AssetsPerFactory contractType="etherspot-v1" />;
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
      <p className="text-md text-left mb-4">
        Transfer your assets from your{" "}
        <span className="font-bold">Archanova</span> or{" "}
        <span className="font-bold">Etherspot V1</span> accounts to another
        account.
      </p>
      <button
        onClick={handlePrevious}
        className="flex items-center gap-2 hover:bg-[#B578DD] border border-[#3C3C53] px-6 py-2 rounded-xl text-white"
      >
        <IoMdReturnLeft size={20} />
        <p>Previous</p>
      </button>
      {getAppScreen(step)}
    </div>
  );
};

export default App;
