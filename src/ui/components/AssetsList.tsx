import { ethers } from "ethers";
import { useState } from "react";
import { useRecoveryKit } from "../hooks/useRecoveryKit";

const AssetsList = () => {
  const { balances, accountAddress, setStep, setSelectedAsset } =
    useRecoveryKit();
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newAsset, setNewAsset] = useState({
    chain: "",
    tokenAddress: "",
  });
  const [addedAssets, setAddedAssets] = useState<AddedAssets[]>(() => {
    const storedAssets = localStorage.getItem("addedAssets");
    return storedAssets
      ? JSON.parse(storedAssets).filter(
          (token: AddedAssets) => token.balance > 0
        )
      : [];
  });

  const allBalances = Object.entries(balances).flatMap(([chain, balances]) =>
    balances.map((balanceInfo) => ({
      ...balanceInfo,
      chain,
    }))
  );

  const addAsset = (asset: AddedAssets) => {
    // Check if the asset already exists
    const assetExists = addedAssets.some(
      (a) => a.tokenAddress === asset.tokenAddress
    );

    if (assetExists) {
      setError("The asset already exists");
      setTimeout(() => {
        setError(null);
      }, 5000);
      return;
    }

    const updatedAssets = [...addedAssets, asset].filter(
      (token) => token.balance > 0
    );
    setAddedAssets(updatedAssets);
    localStorage.setItem("addedAssets", JSON.stringify(updatedAssets));
  };

  // // Delete asset might be useful?
  // const deleteAsset = (asset: AddedAssets) => {
  //   const updatedAssets = addedAssets.filter(
  //     (a) => a.tokenAddress !== asset.tokenAddress
  //   );
  //   setAddedAssets(updatedAssets);
  //   localStorage.setItem("addedAssets", JSON.stringify(updatedAssets));
  // };

  const getBalance = async (
    tokenAddress: string,
    chain: string
  ): Promise<number> => {
    const balance = await window.electron.getBalances(
      "0x19396DE329F9bF5553457956136273c153b62aE4",
      [tokenAddress],
      chain
    );

    const bigIntBalance = balance[0];
    const decimal = await window.electron.getDecimal(tokenAddress, chain);
    const readableBalance = ethers.utils.formatUnits(bigIntBalance, decimal);

    return Number(readableBalance);
  };

  const handleAddAssetSubmit = async () => {
    if (newAsset.tokenAddress && newAsset.chain) {
      const newAssetBalance = await getBalance(
        newAsset.tokenAddress,
        newAsset.chain
      );

      if (newAssetBalance > 0) {
        addAsset({
          chain: newAsset.chain,
          tokenAddress: newAsset.tokenAddress,
          balance: newAssetBalance,
        });
      }
      setNewAsset({ tokenAddress: "", chain: "" });
      setIsAddingAsset(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-lg text-left">Etherspot V1</p>
      <p className="text-sm text-left">Select the asset you want to move</p>

      {allBalances.map((token) => {
        if (Number(token.balance) > 0) {
          return (
            <div
              key={`${token.address}-${token.chain}`}
              className="flex flex-col w-full border border-[#3C3C53] rounded-xl px-6 py-4"
              onClick={() => {
                setStep(4);
                setSelectedAsset(token);
              }}
            >
              <div className="flex justify-between">
                <p className="text-lg text-left">
                  {token.name} ({token.symbol})
                </p>
                <p className="text-lg text-left">{token.balance}</p>
              </div>

              <p className="text-sm text-left">
                on <span className="capitalize">{token.chain}</span>
              </p>
            </div>
          );
        }
      })}
      {addedAssets.map((token) => {
        return (
          <div
            key={token.tokenAddress}
            className="flex flex-col w-full border border-[#3C3C53] rounded-xl px-6 py-4"
            onClick={() => {
              setStep(4);
              setSelectedAsset(token);
            }}
          >
            <div className="flex justify-between">
              <p className="text-lg text-left">
                {token.tokenAddress.substring(0, 6)}...
                {token.tokenAddress.substring(token.tokenAddress.length - 6)}
              </p>
              <p className="text-lg text-left">{token.balance}</p>
            </div>

            <p className="text-sm text-left">
              on <span className="capitalize">{token.chain}</span>
            </p>
          </div>
        );
      })}

      {isAddingAsset ? (
        <div className="flex gap-2 w-full items-end">
          <label className="text-sm text-left">
            Token address
            <input
              type="text"
              value={newAsset.tokenAddress}
              onChange={(e) =>
                setNewAsset({ ...newAsset, tokenAddress: e.target.value })
              }
              required
              className="w-full h-8 !px-2 text-black !text-base !bg-white !rounded-md outline-none focus:outline-none focus:ring-0 focus:border focus:border-[#3C3C53]"
            />
          </label>

          <label className="text-sm text-left">
            Chain
            <select
              value={newAsset.chain}
              onChange={(e) =>
                setNewAsset({ ...newAsset, chain: e.target.value })
              }
              required
              className="w-full h-8 !px-2 text-black !text-base !bg-white !rounded-md outline-none focus:outline-none focus:ring-0 focus:border focus:border-[#3C3C53]"
            >
              <option value="" disabled>
                Select a chain
              </option>
              <option value="ethereum">Ethereum</option>
              <option value="polygon">Polygon</option>
              <option value="optimism">Optimism</option>
              <option value="arbitrum">Arbitrum</option>
              <option value="binance">Binance</option>
            </select>
          </label>
          <div className="flex items-center">
            <button
              onClick={handleAddAssetSubmit}
              className="px-4 bg-[#A55CD6] text-white rounded-md h-8"
            >
              Submit
            </button>
            <button
              onClick={() => setIsAddingAsset(false)}
              className="px-4 text-grey-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div
          className="flex flex-col w-full bg-[#A55CD6] hover:bg-[#B578DD] rounded-xl px-6 py-4 cursor-pointer"
          onClick={() => {
            setIsAddingAsset(true);
          }}
        >
          <p className="text-lg text-white">Add token or NFT</p>
        </div>
      )}
      <p className="text-sm text-white mt-4">{error}</p>
    </div>
  );
};

export default AssetsList;
