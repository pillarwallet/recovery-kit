import { useEffect, useState } from "react";

// icons
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";

// hooks
import { useRecoveryKit } from "../hooks/useRecoveryKit";

const initialChainMapping: Record<Network, string> = {
  polygon: "https://polygon-rpc.com",
  optimism: "https://optimism-rpc.publicnode.com",
  arbitrum: "https://arb1.arbitrum.io/rpc",
  binance: "https://bsc-dataseed1.binance.org",
  ethereum: "https://ethereum-rpc.publicnode.com",
  xdai: "https://rpc.gnosischain.com",
};

const ChangeChainMapping = () => {
  const { onboardingMethod } = useRecoveryKit();
  const [isOpen, setIsOpen] = useState(false);
  const loadChainMappingFromStorage = () => {
    const storedMapping = localStorage.getItem("chainMapping");
    return storedMapping ? JSON.parse(storedMapping) : initialChainMapping;
  };
  const [chainMapping, setChainMapping] = useState<Record<Network, string>>(
    loadChainMappingFromStorage
  );

  const isWalletConnect = onboardingMethod === 'wallet-connect';

  const handleRpcUrlChange = (chain: Network, newUrl: string) => {
    const updatedChainMapping = {
      ...chainMapping,
      [chain]: newUrl,
    };
    setChainMapping(updatedChainMapping);

    localStorage.setItem("chainMapping", JSON.stringify(updatedChainMapping));

    window.electron.updateChainMapping(updatedChainMapping);
  };

  useEffect(() => {
    const storedMapping = loadChainMappingFromStorage();
    setChainMapping(storedMapping);
  }, []);

  const toggleArrow = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div
      className={`flex-col w-full ${
        isOpen &&
        "bg-[#3C3C53] border border-[#3C3C53] px-6 py-2 rounded-xl text-white"
      } `}
    >
      <button
        onClick={toggleArrow}
        disabled={isWalletConnect}
        className={`flex items-center gap-2 border border-[#3C3C53] ${
          !isOpen && "px-6"
        } py-2 rounded-xl text-white ${
          isWalletConnect 
            ? "opacity-50 cursor-not-allowed" 
            : "hover:bg-[#3C3C53]"
        }`}
      >
        <p className="text-md text-left">Edit RPC providers</p>
        {isOpen ? (
          <MdKeyboardArrowUp size={20} />
        ) : (
          <MdKeyboardArrowDown size={20} />
        )}
      </button>
      {isOpen && (
        <form>
          {Object.keys(chainMapping).map((network) => {
            const chain = network as Network;
            return (
              <div key={network} className="flex gap-2 mb-2">
                <p className="flex text-md text-left capitalize w-[200px]">
                  {chain === "xdai" ? "gnosis" : chain}
                </p>
                <input
                  type="text"
                  required
                  className="w-full h-8 !px-2 text-black !text-base !bg-white !rounded-md outline-none focus:outline-none focus:ring-0 focus:border focus:border-[#3C3C53]"
                  value={chainMapping[chain]}
                  onChange={(e) => handleRpcUrlChange(chain, e.target.value)}
                />
              </div>
            );
          })}
        </form>
      )}
    </div>
  );
};

export default ChangeChainMapping;
