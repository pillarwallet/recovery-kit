import { ethers } from "ethers";
import { useState } from "react";

// hooks
import { useRecoveryKit } from "../hooks/useRecoveryKit";

const AssetsList = () => {
  const { balances, accountAddress, setStep, setSelectedAsset } =
    useRecoveryKit();
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [newAsset, setNewAsset] = useState({
    chain: "",
    tokenAddress: "",
    tokenId: "",
  });
  const [addedAssets, setAddedAssets] = useState<AddedAssets[]>(() => {
    const storedAssets = localStorage.getItem("addedAssets");
    return storedAssets
      ? JSON.parse(storedAssets).filter(
          (token: AddedAssets) => token.balance > 0
        )
      : [];
  });
  const [activeTab, setActiveTab] = useState<"tokens" | "nfts">("tokens");

  const allBalances: BalanceInfo[] = Object.entries(balances).flatMap(
    ([chain, balances]) =>
      balances.map((balanceInfo) => ({
        ...balanceInfo,
        chain,
      }))
  );

  const addAsset = (asset: AddedAssets) => {
    // Check if the asset already exists
    const addedAssetExists = addedAssets.some(
      (a) => a.tokenAddress === asset.tokenAddress
    );
    const assetExists = allBalances.some(
      (a) => a.address === asset.tokenAddress
    );

    if (addedAssetExists || assetExists) {
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

  // // TODO - Delete asset might be useful in the future?
  // const deleteAsset = (asset: AddedAssets) => {
  //   const updatedAssets = addedAssets.filter(
  //     (a) => a.tokenAddress !== asset.tokenAddress
  //   );
  //   setAddedAssets(updatedAssets);
  //   localStorage.setItem("addedAssets", JSON.stringify(updatedAssets));
  // };

  const getTokenBalance = async (
    tokenAddress: string,
    chain: string
  ): Promise<number> => {
    try {
      const balance = await window.electron.getBalances(
        accountAddress || "",
        [tokenAddress],
        chain
      );

      const bigIntBalance = balance[0];
      const decimal = await window.electron.getDecimal(tokenAddress, chain);
      const readableBalance = ethers.utils.formatUnits(bigIntBalance, decimal);

      return Number(readableBalance);
    } catch (error) {
      console.error("Error fetching balance:", error);
      setError(
        `Error fetching balance of ${tokenAddress} on ${chain}. Please make sure the token address is valid for this chain.`
      );
      setTimeout(() => {
        setError(null);
      }, 5000);
      return 0;
    }
  };

  const getNftBalance = async (
    nftAddress: string,
    nftId: string,
    chain: string
  ): Promise<number> => {
    try {
      const balance = await window.electron.getNftBalance(
        accountAddress || "",
        nftAddress,
        nftId,
        chain
      );

      return balance;
    } catch (error) {
      console.error("Error fetching balance:", error);
      setError(
        `Error fetching balance of the asset ${nftAddress}. Please make sure the asset address and token id is valid.`
      );
      setTimeout(() => {
        setError(null);
      }, 5000);
      return 0;
    }
  };

  const handleAddAssetSubmit = async (type: "tokens" | "nfts") => {
    if (newAsset.tokenAddress && newAsset.chain && type === "tokens") {
      const newAssetBalance = await getTokenBalance(
        newAsset.tokenAddress,
        newAsset.chain
      );

      if (newAssetBalance > 0) {
        addAsset({
          chain: newAsset.chain,
          tokenAddress: newAsset.tokenAddress,
          balance: newAssetBalance,
          assetType: "token",
        });
      }
      setMessage(
        `New asset ${newAsset.tokenAddress} on ${(
          <span className="capitalize">{newAsset.chain}</span>
        )} successfully added`
      );
      setTimeout(() => {
        setMessage(null);
      }, 5000);
      setNewAsset({ tokenAddress: "", chain: "", tokenId: "" });
      setIsAddingAsset(false);
    }

    if (
      newAsset.tokenAddress &&
      newAsset.chain &&
      newAsset.tokenId &&
      type === "nfts"
    ) {
      const newAssetBalance = await getNftBalance(
        newAsset.tokenAddress,
        newAsset.tokenId,
        newAsset.chain
      );

      if (newAssetBalance > 0) {
        addAsset({
          chain: newAsset.chain,
          tokenAddress: newAsset.tokenAddress,
          balance: newAssetBalance,
          assetType: "nft",
          tokenId: newAsset.tokenId,
        });
      }
      setMessage(`New asset ${newAsset.tokenAddress} successfully added`);
      setTimeout(() => {
        setMessage(null);
      }, 5000);
      setNewAsset({ tokenAddress: "", chain: "", tokenId: "" });
      setIsAddingAsset(false);
    }
  };

  const combinedTokens = [
    ...allBalances,
    ...addedAssets.filter((asset) => asset.assetType === "token"),
  ];

  // Group tokens by chain
  const groupedTokens = combinedTokens.reduce(
    (acc: Record<string, typeof combinedTokens>, token) => {
      if (!acc[token.chain]) {
        acc[token.chain] = [];
      }
      acc[token.chain].push(token);
      return acc;
    },
    {}
  );

  return (
    <div className="flex flex-col gap-4 w-full">
      <p className="text-lg text-left">Etherspot V1</p>
      <p className="text-sm text-left">Select the asset you want to move</p>

      <div className="flex mb-4 w-full">
        <button
          className={`px-4 py-2 w-full ${
            activeTab === "tokens"
              ? "border-b-2 border-[#A55CD6] font-bold"
              : "border-b border-gray-400"
          }`}
          onClick={() => setActiveTab("tokens")}
        >
          Tokens
        </button>
        <button
          className={`px-4 py-2 w-full ${
            activeTab === "nfts"
              ? "border-b-2 border-[#A55CD6] font-bold"
              : "border-b border-gray-400"
          }`}
          onClick={() => setActiveTab("nfts")}
        >
          NFTs
        </button>
      </div>

      {activeTab === "tokens" ? (
        <div>
          {Object.keys(groupedTokens).map((chainName) => (
            <div key={chainName} className="mb-6">
              <h2 className="text-xl font-semibold mb-4 capitalize">
                {chainName}
              </h2>
              {groupedTokens[chainName].map((token) => (
                <div
                  key={`${
                    token && "name" in token
                      ? token.address
                      : token.tokenAddress
                  }-${token.chain}`}
                  className="flex flex-col w-full border border-[#3C3C53] rounded-xl px-6 py-4 mb-4 cursor-pointer"
                  onClick={() => {
                    setStep(4);
                    setSelectedAsset(token);
                  }}
                >
                  <div className="flex justify-between">
                    <p className="text-lg text-left">
                      {token && "name" in token
                        ? `${token.name} (${token.symbol})`
                        : `${token.tokenAddress.substring(
                            0,
                            6
                          )}...${token.tokenAddress.substring(
                            token.tokenAddress.length - 6
                          )}`}
                    </p>
                    <p className="text-lg text-left">{token.balance}</p>
                  </div>

                  <p className="text-sm text-left">
                    on <span className="capitalize">{token.chain}</span>
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div>
          {addedAssets
            .filter((asset) => asset.assetType === "nft")
            .map((asset) => (
              <div
                key={`${asset.tokenAddress}`}
                className="flex flex-col w-full border border-[#3C3C53] rounded-xl px-6 py-4 mb-4 cursor-pointer"
                onClick={() => {
                  setStep(4);
                  setSelectedAsset(asset);
                }}
              >
                <div className="flex justify-between">
                  <p className="text-lg text-left">
                    {`${asset.tokenAddress.substring(
                      0,
                      6
                    )}...${asset.tokenAddress.substring(
                      asset.tokenAddress.length - 6
                    )}`}
                  </p>
                  <p className="text-lg text-left">{asset.balance}</p>
                </div>
              </div>
            ))}
        </div>
      )}

      {isAddingAsset ? (
        <div className="flex gap-2 w-full items-end">
          <label className="text-sm text-left">
            Asset address
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

          {activeTab === "nfts" && (
            <label className="text-sm text-left">
              Token ID
              <input
                type="text"
                value={newAsset.tokenId}
                onChange={(e) =>
                  setNewAsset({ ...newAsset, tokenId: e.target.value })
                }
                required
                className="w-full h-8 !px-2 text-black !text-base !bg-white !rounded-md outline-none focus:outline-none focus:ring-0 focus:border focus:border-[#3C3C53]"
              />
            </label>
          )}

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
              <option value="xdai">Xdai</option>
            </select>
          </label>
          <div className="flex items-center">
            <button
              onClick={() => handleAddAssetSubmit(activeTab)}
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
      <p className="text-sm text-white mt-4">{error || message}</p>
    </div>
  );
};

export default AssetsList;
