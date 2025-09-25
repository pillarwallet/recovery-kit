import { useState, useEffect } from "react";
import { RiExternalLinkLine } from "react-icons/ri";
import { isAddress } from "viem";

// hooks
import { useRecoveryKit } from "../hooks/useRecoveryKit";

// utils
import { getBlockScan, getNativeTokenSymbol, getAddressForContractType, getContractDisplayName } from "../utils/index";

const TransferToken = () => {
  const { 
    selectedAsset, 
    accountAddress, 
    seedPhrase, 
    EOAWalletAddress,
    contract,
    archanovaAddress 
  } = useRecoveryKit();
  
  // Get the appropriate address based on contract type
  const selectedAddress = getAddressForContractType(contract || "etherspot-v1", {
    accountAddress,
    archanovaAddress,
    EOAWalletAddress,
  });
  const [transferAddress, setTransferAddress] = useState<string>("");
  const [gasEstimation, setGasEstimation] = useState<string>("");
  const [nativeTokenBalance, setNativeTokenBalance] = useState<string>();
  const [transferStatus, setTransferStatus] = useState<string | null>(null);
  const [isContractDeployed, setIsContractDeployed] = useState<boolean | null>(null);
  const [isCheckingDeployment, setIsCheckingDeployment] = useState<boolean>(false);

  // Check if Archanova contract is deployed
  useEffect(() => {
    const checkContractDeployment = async () => {
      if (contract === "archanova" && selectedAddress && selectedAsset?.chain) {
        setIsCheckingDeployment(true);
        try {
          const code = await window.electron.getCode(selectedAddress, selectedAsset.chain);
          // If getCode returns "0x" or empty string, no contract is deployed
          const isDeployed = Boolean(code && code !== "0x" && !code.startsWith("Error"));
          setIsContractDeployed(isDeployed);
        } catch (error) {
          console.error("Error checking contract deployment:", error);
          setIsContractDeployed(false);
        } finally {
          setIsCheckingDeployment(false);
        }
      } else {
        // For non-Archanova contracts, assume deployed
        setIsContractDeployed(true);
      }
    };

    checkContractDeployment();
  }, [contract, selectedAddress, selectedAsset?.chain]);

  const estimateGas = async (
    accountAddress: string,
    tokenAddress: string,
    recipientAddress: string,
    amount: string,
    chain: string
  ): Promise<string> => {
    const privateKey = await window.electron.getPrivateKey(seedPhrase);
    const estimatedGas = await window.electron.estimateGas(
      accountAddress,
      tokenAddress,
      recipientAddress,
      amount,
      chain,
      privateKey,
      contract || "etherspot-v1"
    );

    return estimatedGas;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const tokenAddress =
      selectedAsset && "name" in selectedAsset
        ? selectedAsset.address
        : selectedAsset?.tokenAddress;

    const amount =
      selectedAsset && "name" in selectedAsset
        ? selectedAsset.balance
        : selectedAsset?.balance;

    if (
      selectedAsset &&
      "assetType" in selectedAsset &&
      selectedAsset.assetType === "nft"
    ) {
      const estimatedGasNftTransfer =
        await window.electron.estimateGasNftTransfer(
          selectedAddress as string,
          transferAddress,
          tokenAddress as string,
          selectedAsset.tokenId as string,
          selectedAsset?.chain as string
        );

      setGasEstimation(estimatedGasNftTransfer);
    } else {
      const estimatedGas = await estimateGas(
        selectedAddress as string,
        tokenAddress as string,
        transferAddress,
        amount as string,
        selectedAsset?.chain as string
      );

      setGasEstimation(estimatedGas);
    }

    const nativeToken = await window.electron.getNativeBalance(
      EOAWalletAddress as string,
      selectedAsset?.chain as string
    );

    setNativeTokenBalance(nativeToken);
  };

  const handleTransfer = async () => {
    setTransferStatus("Initiating transfer...");

    const tokenAddress =
      selectedAsset && "name" in selectedAsset
        ? selectedAsset.address
        : selectedAsset?.tokenAddress;

    const amount =
      selectedAsset && "name" in selectedAsset
        ? selectedAsset.balance
        : selectedAsset?.balance;

    try {
      const privateKey = await window.electron.getPrivateKey(seedPhrase);

      if (
        selectedAsset &&
        "assetType" in selectedAsset &&
        selectedAsset.assetType === "nft"
      ) {
        const result = await window.electron.transferNft(
          selectedAddress as string,
          transferAddress,
          tokenAddress as string,
          selectedAsset.tokenId as string,
          selectedAsset?.chain as string,
          privateKey,
          contract || "etherspot-v1"
        );

        setTransferStatus(result);
      } else {
        const result = await window.electron.transferTokens(
          selectedAddress as string,
          tokenAddress as string,
          transferAddress,
          amount as string,
          selectedAsset?.chain as string,
          privateKey,
          contract || "etherspot-v1"
        );

        setTransferStatus(result);
      }
    } catch (error) {
      setTransferStatus(`Transfer failed: ${error}`);
    }
  };

  const isNotEnoughGasToken =
    Number(gasEstimation) > (Number(nativeTokenBalance) || 0);

  // Show loading state while checking deployment
  if (isCheckingDeployment) {
    return (
      <div className="flex flex-col gap-4 w-full">
        <p className="text-lg text-left">
          {getContractDisplayName(contract || "etherspot-v1")}
        </p>
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#A55CD6]"></div>
          <p className="text-sm text-left">Checking contract deployment...</p>
        </div>
      </div>
    );
  }

  // Show deployment required message for Archanova
  if (contract === "archanova" && isContractDeployed === false) {
    return (
      <div className="flex flex-col gap-4 w-full">
        <p className="text-lg text-left">
          {getContractDisplayName(contract || "etherspot-v1")}
        </p>
        <div className="flex gap-3 items-start p-4 bg-amber-200 border-l-4 border-amber-400 rounded-r-lg">
          <div className="flex-1">
            <p className="text-sm text-left text-amber-700">
              Your Archanova account contract is not deployed yet. You need to deploy the contract before you can transfer assets.
            </p>
            <button
              className="mt-3 text-sm bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-lg text-white"
              onClick={() => {
                // TODO: Implement contract deployment
                alert("Contract deployment functionality will be implemented soon!");
              }}
            >
              Deploy Contract
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <p className="text-lg text-left">
        {getContractDisplayName(contract || "etherspot-v1")}
      </p>
      <p className="text-lg text-left">
        You are transferring {selectedAsset?.balance || 0}{" "}
        {selectedAsset && "name" in selectedAsset
          ? `${selectedAsset.name} (${selectedAsset.symbol})`
          : `${selectedAsset?.tokenAddress.substring(
              0,
              6
            )}...${selectedAsset?.tokenAddress.substring(
              selectedAsset.tokenAddress.length - 6
            )} on ${selectedAsset?.chain}`}{" "}
        on{" "}
        <span className="capitalize">
          {selectedAsset?.chain === "xdai" ? "gnosis" : selectedAsset?.chain}
        </span>
      </p>
      <p className="text-sm text-left">Enter the destination for this asset</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label className="text-sm text-left">
          Recipient address
          <input
            type="text"
            value={transferAddress}
            onChange={(e) => setTransferAddress(e.target.value)}
            required
            className="w-full h-8 !px-2 text-black !text-base !bg-white !rounded-md outline-none focus:outline-none focus:ring-0 focus:border focus:border-[#3C3C53]"
          />
        </label>
        {!isAddress(transferAddress) && (transferAddress as string) !== "" ? (
          <p className="text-sm text-left">
            The address is not valid. Please enter a valid wallet address.
          </p>
        ) : (
          <button
            type="submit"
            className="text-base bg-[#A55CD6] hover:bg-[#B578DD] px-6 py-2 rounded-xl text-white mt-8"
            onClick={() => handleSubmit}
          >
            Estimate Transfer Cost
          </button>
        )}
      </form>
      {(gasEstimation || nativeTokenBalance) && (
        <div className="flex flex-col">
          <p className="text-lg text-left">Transfer cost:</p>
          <p className="text-sm text-left">
            The cost to transfer this asset is{" "}
            <span className="font-semibold">
              {gasEstimation}{" "}
              {getNativeTokenSymbol(selectedAsset?.chain as ChainType)}
            </span>
            . You currently have {nativeTokenBalance}{" "}
            {getNativeTokenSymbol(selectedAsset?.chain as ChainType)} in your
            EOA Wallet to pay for this transaction.
          </p>
          {isNotEnoughGasToken && (
            <p className="text-sm text-left">
              You do not have enough{" "}
              {getNativeTokenSymbol(selectedAsset?.chain as ChainType)} in your
              EOA Wallet ({EOAWalletAddress}) to execute this transaction.
              Please make sure your EOA Wallet has enough gas tokens.
            </p>
          )}
          {!Number(gasEstimation) && (
            <p className="text-sm text-left">
              Oops, something went wrong and we are unable to estimate gas for
              this transaction. Please try again.
            </p>
          )}
        </div>
      )}
      {gasEstimation && (!isNotEnoughGasToken || !Number(gasEstimation)) && (
        <button
          onClick={handleTransfer}
          className="text-base bg-[#4CAF50] hover:bg-[#66BB6A] px-6 py-2 rounded-xl text-white mt-4"
        >
          Transfer
        </button>
      )}

      {transferStatus?.includes("0x") ? (
        <a
          className="flex w-fit gap-2 text-base bg-[#A55CD6] hover:bg-[#B578DD] px-6 py-2 rounded-xl text-white mt-8"
          href={`${getBlockScan(
            selectedAsset?.chain as ChainType
          )}${transferStatus}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          View transaction
          <RiExternalLinkLine className="h-auto w-4" />
        </a>
      ) : (
        <p className="text-sm text-left mt-4 text-white">{transferStatus}</p>
      )}
    </div>
  );
};

export default TransferToken;
