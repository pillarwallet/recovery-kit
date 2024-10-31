import { ethers } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { FaRedo } from "react-icons/fa";
import { useRecoveryKit } from "../hooks/useRecoveryKit";
import ArbitrumList from "../utils/tokens/arbitrum-tokens.json";
import BinanceList from "../utils/tokens/binance-tokens.json";
import EthereumList from "../utils/tokens/ethereum-tokens.json";
import OptimismList from "../utils/tokens/optimism-tokens.json";
import PolygonList from "../utils/tokens/polygon-tokens.json";
import LoadingSpinner from "./LoadingSpinner";

const tokenLists = {
  ethereum: EthereumList,
  polygon: PolygonList,
  optimism: OptimismList,
  arbitrum: ArbitrumList,
  binance: BinanceList,
};

type AssetsPerFactoryType = {
  contractType: "etherspot-v1" | "archanova";
};

const AssetsPerFactory = ({ contractType }: AssetsPerFactoryType) => {
  const { balances, setBalances, setStep, setContract } = useRecoveryKit();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // TODO: replace with accountAddress hook
  const accountAddress = "0x19396DE329F9bF5553457956136273c153b62aE4";

  const getAllBalances = useCallback(
    async (tokenList: TokenList[], chain: string): Promise<BalanceInfo[]> => {
      const tokenAddresses = tokenList.map((token) => token.address);
      let retries = 0;
      const maxRetries = 3;

      setError("");

      while (retries < maxRetries) {
        try {
          const balances = await window.electron.getBalances(
            accountAddress,
            tokenAddresses,
            chain
          );

          return balances
            .map((balance: bigint, index: number) => {
              const token = tokenList[index];
              const readableBalance = ethers.utils.formatUnits(
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
    [accountAddress]
  );

  const fetchAllBalances = async () => {
    const chainBalances: BalancesByChain = {};
    setIsLoading(true);

    for (const [chain, tokenList] of Object.entries(tokenLists)) {
      const balancesForChain = await getAllBalances(
        tokenList.tokens as TokenList[],
        chain
      );
      chainBalances[chain] = balancesForChain;
    }

    setBalances(chainBalances);

    setIsLoading(false);
  };

  useEffect(() => {
    if (accountAddress) {
      fetchAllBalances();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountAddress]);

  const balancesCounts = Object.entries(balances).map(([chain, tokens]) => ({
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
        numberOfAssets > 0 && "cursor-pointer"
      }`}
      onClick={
        numberOfAssets > 0
          ? () => {
              setStep(3);
              setContract(contractType);
            }
          : () => null
      }
    >
      <p className="text-lg text-left capitalize">{contractType}</p>
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
