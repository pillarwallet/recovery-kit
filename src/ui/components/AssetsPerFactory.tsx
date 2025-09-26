import { useCallback, useEffect, useState } from "react";
import { FaRedo } from "react-icons/fa";
import { formatUnits } from "viem";

// hooks
import { useRecoveryKit } from "../hooks/useRecoveryKit";

// utils
import { allNativeTokens, getAddressForContractType } from "../utils";

// components
import ArbitrumList from "../utils/tokens/arbitrum-tokens.json";
import BinanceList from "../utils/tokens/binance-tokens.json";
import EthereumList from "../utils/tokens/ethereum-tokens.json";
import GnosisList from "../utils/tokens/gnosis-tokens.json";
import OptimismList from "../utils/tokens/optimism-tokens.json";
import PolygonList from "../utils/tokens/polygon-tokens.json";
import LoadingSpinner from "./LoadingSpinner";

const tokenLists = {
  ethereum: EthereumList,
  polygon: PolygonList,
  optimism: OptimismList,
  arbitrum: ArbitrumList,
  binance: BinanceList,
  xdai: GnosisList,
};

type AssetsPerFactoryType = {
  contractType: "etherspot-v1" | "archanova";
};

const AssetsPerFactory = ({ contractType }: AssetsPerFactoryType) => {
  const { 
    balances, 
    setBalances, 
    setStep, 
    setContract, 
    accountAddress,
    archanovaAddress,
    EOAWalletAddress 
  } = useRecoveryKit();
  
  // Get the appropriate address based on contract type
  const selectedAddress = getAddressForContractType(contractType, {
    accountAddress,
    archanovaAddress,
    EOAWalletAddress,
  });
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [addedAssets, setAddedAssets] = useState<AddedAssets[]>(() => {
    const storedAssets = localStorage.getItem("addedAssets");
    return storedAssets
      ? JSON.parse(storedAssets).filter(
          (token: AddedAssets) => Number(token.balance) > 0
        )
      : [];
  });

  const getTokenBalance = async (
    tokenAddress: string,
    chain: string
  ): Promise<string> => {
    try {
      const balance = await window.electron.getBalances(
        selectedAddress || "",
        [tokenAddress],
        chain
      );

      const bigIntBalance = balance[0];
      const decimal = await window.electron.getDecimal(tokenAddress, chain);
      const readableBalance = formatUnits(bigIntBalance, Number(decimal) || 18);

      return readableBalance;
    } catch (error) {
      console.error("Error fetching balance:", error);
      return "0";
    }
  };

  const getNftBalance = async (
    nftAddress: string,
    nftId: string,
    chain: string
  ): Promise<number> => {
    try {
      const balance = await window.electron.getNftBalance(
        selectedAddress || "",
        nftAddress,
        nftId,
        chain
      );

      return balance;
    } catch (error) {
      console.error("Error fetching balance:", error);
      return 0;
    }
  };

  const refetchBalances = async () => {
    const updatedAssets = await Promise.all(
      addedAssets.map(async (asset) => {
        let updatedBalance: string | number | undefined = "0";

        if (asset.assetType === "token") {
          updatedBalance = await getTokenBalance(
            asset.tokenAddress,
            asset.chain
          );
        } else if (asset.assetType === "nft") {
          updatedBalance = await getNftBalance(
            asset.tokenAddress,
            asset.tokenId || "",
            asset.chain
          );
        }

        return {
          ...asset,
          balance: updatedBalance?.toString(),
        };
      })
    );

    const filteredAssets = updatedAssets.filter(
      (asset) => Number(asset.balance) > 0
    );
    setAddedAssets(filteredAssets);
    localStorage.setItem("addedAssets", JSON.stringify(filteredAssets));
  };

  const getAllBalances = useCallback(
    async (tokenList: TokenList[], chain: string): Promise<BalanceInfo[]> => {
      const tokenAddresses = tokenList.map((token) => token.address);
      let retries = 0;
      const maxRetries = 3;

      setError("");

      while (retries < maxRetries) {
        try {
          const balances = await window.electron.getBalances(
            selectedAddress as string,
            tokenAddresses,
            chain
          );

          const nativeBalance = await window.electron.getNativeBalance(
            selectedAddress as string,
            chain
          );

          // Prepare the native token information
          const nativeTokenInfo: BalanceInfo = {
            chain,
            address: "0x0000000000000000000000000000000000000000",
            decimals: 18,
            balance: nativeBalance,
            name: allNativeTokens[chain as Network].name,
            symbol: allNativeTokens[chain as Network].symbol,
            logoURI: "",
          };

          const tokenBalances = balances
            .map((balance: bigint, index: number) => {
              const token = tokenList[index];
              const readableBalance = formatUnits(
                balance,
                Number(token.decimals)
              );
              return {
                chain,
                address: token.address,
                decimals: Number(token.decimals),
                balance: readableBalance,
                name: token.name,
                symbol: token.symbol,
                logoURI: token.logoURI,
              };
            })
            .filter(
              (tokenInfo: BalanceInfo) => parseFloat(tokenInfo.balance) > 0
            );

          return [nativeTokenInfo, ...tokenBalances];
        } catch (error) {
          retries += 1;
          console.error(
            `Attempt ${retries} - Error fetching balances for ${chain}:`,
            error
          );

          if (retries >= maxRetries) {
            setError(
              `Error fetching balances for ${chain} after ${maxRetries} attempts. Please try again.`
            );
          }
        }
      }
      return [];
    },
    [selectedAddress]
  );

  const fetchAllBalances = async () => {
    const chainBalances: BalancesByChain = {};
    setIsLoading(true);

    // For Archanova, only fetch ethereum mainnet balances
    const chainsToFetch = contractType === "archanova" 
      ? { ethereum: tokenLists.ethereum }
      : tokenLists;

    for (const [chain, tokenList] of Object.entries(chainsToFetch)) {
      const balancesForChain = await getAllBalances(
        tokenList.tokens as TokenList[],
        chain
      );
      chainBalances[chain] = balancesForChain;
    }

    setBalances(prevBalances => ({
      ...prevBalances,
      [contractType]: chainBalances
    }));

    setIsLoading(false);
  };

  useEffect(() => {
    if (selectedAddress) {
      fetchAllBalances();
      refetchBalances();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddress]);

  const balancesCounts = Object.entries(balances[contractType] || {}).map(([chain, tokens]) => ({
    chain,
    count: tokens.length,
  }));

  const numberOfChains = balancesCounts.filter(
    (chain) => chain.count > 0
  ).length;
  const numberOfAssets = balancesCounts.reduce(
    (acc, { count }) => acc + count,
    0
  );

  return (
    <div
      className={`flex flex-col w-full border border-[#3C3C53] rounded-xl px-6 py-4 ${
        numberOfAssets > 0 && !isLoading && "cursor-pointer"
      }`}
      onClick={
        numberOfAssets > 0 && !isLoading
          ? () => {
              setStep(3);
              setContract(contractType);
            }
          : () => null
      }
    >
      <p className="text-lg text-left capitalize">
        {contractType === "etherspot-v1" ? "Etherspot V1" : contractType}
      </p>
      {isLoading ? (
        <div className="flex gap-4">
          <LoadingSpinner size={20} />
          <p className="text-sm text-left">Loading assets...</p>
        </div>
      ) : (
        <p className="text-sm text-left">
          {numberOfAssets} assets on {numberOfChains} chains
        </p>
      )}
      {error !== "" && (
        <div className="flex justify-between">
          <p className="text-sm text-left">{error}</p>
          <FaRedo size={20} onClick={() => fetchAllBalances()} />
        </div>
      )}
    </div>
  );
};

export default AssetsPerFactory;
