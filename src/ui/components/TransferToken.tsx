import { useState } from "react";
import { useRecoveryKit } from "../hooks/useRecoveryKit";
import { getNativeTokenSymbol } from "../utils/constants";

const TransferToken = () => {
  const { selectedAsset } = useRecoveryKit();
  const [transferAddress, setTransferAddress] = useState<string>("");
  const [gasEstimation, setGasEstimation] = useState<number>();
  const [nativeTokenBalance, setNativeTokenBalance] = useState<number>();

  const [transferStatus, setTransferStatus] = useState<string | null>(null); // Track transfer status

  const getNativeBalance = async (
    tokenAddress: string,
    chain: string
  ): Promise<number> => {
    const balance = await window.electron.getNativeBalance(
      "0x19396DE329F9bF5553457956136273c153b62aE4",
      chain
    );

    return balance;
  };

  const estimateGas = async (
    tokenAddress: string,
    recipientAddress: string,
    amount: string,
    chain: string
  ): Promise<any> => {
    const estimatedGas = await window.electron.estimateGas(
      tokenAddress,
      recipientAddress,
      amount,
      chain
    );

    return estimatedGas;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log("Transferring to:", transferAddress);

    const tokenAddress =
      selectedAsset && "name" in selectedAsset
        ? selectedAsset.address
        : selectedAsset?.tokenAddress;

    const amount =
      selectedAsset && "name" in selectedAsset
        ? selectedAsset.balance
        : selectedAsset?.balance;

    const estimatedGas = await estimateGas(
      tokenAddress as string,
      transferAddress,
      amount?.toString() as string,
      selectedAsset?.chain as string
    );

    const nativeToken = await getNativeBalance(
      "0x19396DE329F9bF5553457956136273c153b62aE4",
      selectedAsset?.chain as string
    );

    setGasEstimation(estimatedGas);
    setNativeTokenBalance(nativeToken);

    setTransferAddress("");
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
      console.log("prout 1");
      const result = await window.electron.transferTokens(
        tokenAddress as string,
        transferAddress,
        amount?.toString() as string,
        selectedAsset?.chain as string
      );

      console.log("prout 2");
      setTransferStatus(result); // Show the result (success or failure)
    } catch (error) {
      setTransferStatus(`Transfer failed: ${error}`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
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
          Token address
          <input
            type="text"
            value={transferAddress}
            onChange={(e) => setTransferAddress(e.target.value)} // Update directly to string
            required
            className="w-full h-8 !px-2 text-black !text-base !bg-white !rounded-md outline-none focus:outline-none focus:ring-0 focus:border focus:border-[#3C3C53]"
          />
        </label>
        <button
          type="submit"
          className="text-base bg-[#A55CD6] hover:bg-[#B578DD] px-6 py-2 rounded-xl text-white mt-8"
          onClick={() => handleSubmit}
        >
          Continue
        </button>
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
            Smart Wallet.
          </p>
        </div>
      )}
      {gasEstimation && (
        <button
          onClick={handleTransfer}
          className="text-base bg-[#4CAF50] hover:bg-[#66BB6A] px-6 py-2 rounded-xl text-white mt-4"
        >
          Transfer
        </button>
      )}
      {transferStatus && (
        <p className="text-sm text-left mt-4 text-gray-700">{transferStatus}</p>
      )}
    </div>
  );
};

export default TransferToken;
