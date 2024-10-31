/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useRecoveryKit } from "../hooks/useRecoveryKit";
import LoadingSpinner from "./LoadingSpinner";

const MnemonicInput = () => {
  const [seedPhrase, setSeedPhrase] = useState<string[]>(Array(12).fill(""));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { setAccountAddress, setStep } = useRecoveryKit();

  const handleWordChange = (index: number, value: string) => {
    const newWords = [...seedPhrase];
    newWords[index] = value;
    setSeedPhrase(newWords);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setIsLoading(true);

    // Send the 12 words to the electron backend
    const accountAddressRes = await (window as any).electron.submitMnemonic(
      seedPhrase
    );

    if (
      accountAddressRes?.includes("Error to get the account address:") ||
      accountAddressRes?.includes("Error processing the 12 words phrase")
    ) {
      setAccountAddress(null);
      setError(
        "Oops, something went wrong. Please make sure your 12 word seed phrase is correct and try again."
      );
      setTimeout(() => {
        setError(null);
      }, 5000);
    }

    if (accountAddressRes?.includes("0x")) {
      setAccountAddress(accountAddressRes);
      setStep(2);
    }

    setIsLoading(false);
  };

  return (
    <div className="flex flex-col">
      <p className="text-sm text-left mb-4">
        Please enter your 12 word seed phrase to continue.
      </p>
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
          }}
        >
          {seedPhrase.map((word, index) => (
            <div key={index}>
              <label className="text-xs">
                Word {index + 1}
                <input
                  type="text"
                  value={word}
                  onChange={(e) => handleWordChange(index, e.target.value)}
                  required
                  className="w-full h-8 !px-2 text-black !text-base !bg-white !rounded-md outline-none focus:outline-none focus:ring-0 focus:border focus:border-[#3C3C53]"
                />
              </label>
            </div>
          ))}
        </div>
        <button
          type="submit"
          className="text-base bg-[#A55CD6] hover:bg-[#B578DD] px-6 py-2 rounded-xl text-white mt-8"
        >
          {isLoading ? <LoadingSpinner size={20} /> : "Continue"}
        </button>
        <p className="text-sm text-white mt-4">{error}</p>
      </form>
    </div>
  );
};

export default MnemonicInput;
