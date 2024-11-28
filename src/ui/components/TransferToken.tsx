import { useState } from "react";
import { RiExternalLinkLine } from "react-icons/ri";
import { isAddress } from "viem";

// hooks
import { useRecoveryKit } from "../hooks/useRecoveryKit";

// utils
import { getBlockScan, getNativeTokenSymbol } from "../utils/index";

const TransferToken = () => {
  const { selectedAsset, accountAddress, seedPhrase } = useRecoveryKit();
  const [transferAddress, setTransferAddress] = useState<string>("");
  const [gasEstimation, setGasEstimation] = useState<string>("");
  const [nativeTokenBalance, setNativeTokenBalance] = useState<number>();

  const [transferStatus, setTransferStatus] = useState<string | null>(null);

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
      privateKey
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
          accountAddress as string,
          transferAddress,
          tokenAddress as string,
          selectedAsset.tokenId as string,
          selectedAsset?.chain as string
        );

      setGasEstimation(estimatedGasNftTransfer);
    } else {
      const estimatedGas = await estimateGas(
        accountAddress as string,
        tokenAddress as string,
        transferAddress,
        amount?.toString() as string,
        selectedAsset?.chain as string
      );

      setGasEstimation(estimatedGas);
    }

    const privateKey = await window.electron.getPrivateKey(seedPhrase);

    const EAOAddress = await window.electron.getEOAAddress(privateKey);

    const nativeToken = await window.electron.getNativeBalance(
      EAOAddress as string,
      selectedAsset?.chain as string
    );

    setNativeTokenBalance(nativeToken as number);
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
          accountAddress as string,
          transferAddress,
          tokenAddress as string,
          selectedAsset.tokenId as string,
          selectedAsset?.chain as string,
          privateKey
        );

        setTransferStatus(result);
      } else {
        const result = await window.electron.transferTokens(
          accountAddress as string,
          tokenAddress as string,
          transferAddress,
          amount?.toString() as string,
          selectedAsset?.chain as string,
          privateKey
        );

        setTransferStatus(result);
      }
    } catch (error) {
      setTransferStatus(`Transfer failed: ${error}`);
    }
  };

  const isNotEnoughGasToken = Number(gasEstimation) > (nativeTokenBalance || 0);

  return (
    <div className="flex flex-col gap-4 w-full">
      <p className="text-lg text-left">
        Transfer{" "}
        {selectedAsset && "name" in selectedAsset
          ? `${selectedAsset.name} ${selectedAsset.symbol}`
          : `${selectedAsset?.tokenAddress.substring(
              0,
              6
            )}...${selectedAsset?.tokenAddress.substring(
              selectedAsset.tokenAddress.length - 6
            )}`}
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
        {!isAddress(transferAddress) ? (
          <p className="text-sm text-left">
            The address is not valid. Please enter a valid wallet address.
          </p>
        ) : (
          <button
            type="submit"
            className="text-base bg-[#A55CD6] hover:bg-[#B578DD] px-6 py-2 rounded-xl text-white mt-8"
            onClick={() => handleSubmit}
          >
            Continue
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
            Wallet.
          </p>
          {isNotEnoughGasToken && (
            <p className="text-sm text-left">
              You do not have enough{" "}
              {getNativeTokenSymbol(selectedAsset?.chain as ChainType)} in your
              Wallet to execute this transaction. Please make sure your EOA
              Wallet has enough gas tokens.
            </p>
          )}
        </div>
      )}
      {gasEstimation && !isNotEnoughGasToken && (
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
