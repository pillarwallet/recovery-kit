import React, { useRef, useState } from "react";

// hooks
import { useRecoveryKit } from "../hooks/useRecoveryKit";

// components
import LoadingSpinner from "./LoadingSpinner";

const MnemonicInput = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const {
    setAccountAddress,
    setStep,
    seedPhrase,
    setSeedPhrase,
    setEOAWalletAddress,
    setArchanovaAddress,
    setOnboardingMethod,
  } = useRecoveryKit();
  const [activeTab, setActiveTab] = useState<"phrase" | "pk">("phrase");
  const [privateKey, setPrivateKey] = useState<string>("");
  const inputContainerRef = useRef<HTMLDivElement>(null);

  const handleWordChange = (index: number, value: string) => {
    const newWords = [...seedPhrase];
    newWords[index] = value;
    setSeedPhrase(newWords);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData("text");
    const cleanedWords = pastedText
      .trim()
      .replace(/[\n\t,]+/g, " ")
      .split(/\s+/)
      .map((w) => w.replace(/[^a-zA-Z]/g, "").toLowerCase())
      .filter((w) => w.length > 0);

    if (cleanedWords.length === 12) {
      setSeedPhrase(cleanedWords);
      e.preventDefault();
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setIsLoading(true);

    try {
      const accountAddressRes =
        activeTab === "phrase"
          ? await window.electron.submitMnemonic(seedPhrase)
          : await window.electron.getAccountAddress(privateKey);

      if (!accountAddressRes || accountAddressRes.includes("Error")) {
        setAccountAddress(null);
        setEOAWalletAddress(null);
        setError(
          `Oops, something went wrong. Please make sure your ${
            activeTab === "phrase" ? "12-word seed phrase" : "private key"
          } is correct and try again.`
        );
        setTimeout(() => setError(null), 5000);
        return;
      }

      if (accountAddressRes?.includes("0x")) {
        setAccountAddress(accountAddressRes);

        const privateKey = await window.electron.getPrivateKey(seedPhrase);
        const EOAAddress = await window.electron.getEOAAddress(privateKey);
        setEOAWalletAddress(EOAAddress);

        const archanova = await window.electron.getArchanovaAddress(privateKey);
        console.log("archanova", archanova);
        if (archanova && !archanova.includes("Error") && archanova.includes("0x")) {
          setArchanovaAddress(archanova);
        } else {
          setArchanovaAddress(null);
        }

        setStep(2);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      setError("An unexpected error occurred. Please try again.");
      console.log(e);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <button
        onClick={() => setOnboardingMethod(null)}
        className="self-start mb-4 text-sm text-gray-400 hover:text-white transition-colors"
      >
        ← Choose different method
      </button>
      <div className="flex mb-4 w-full">
        <button
          className={`px-4 py-2 w-full ${
            activeTab === "phrase"
              ? "border-b-2 border-[#A55CD6] font-bold"
              : "border-b border-gray-400"
          }`}
          onClick={() => setActiveTab("phrase")}
        >
          12-words phrase
        </button>
        <button
          className={`px-4 py-2 w-full ${
            activeTab === "pk"
              ? "border-b-2 border-[#A55CD6] font-bold"
              : "border-b border-gray-400"
          }`}
          onClick={() => setActiveTab("pk")}
        >
          Private key
        </button>
      </div>
      {activeTab === "phrase" ? (
        <div className="flex flex-col w-full">
          <p className="text-sm text-left mb-4">
            Please enter your 12 word seed phrase to continue. You can also
            paste all 12 words at once.
          </p>
          <form onSubmit={handleSubmit}>
            <div
              ref={inputContainerRef}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "10px",
              }}
              onPaste={handlePaste}
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
      ) : (
        <div className="flex flex-col w-full">
          <p className="text-sm text-left mb-4">
            Please enter your wallet private key to continue.
          </p>
          <form onSubmit={handleSubmit}>
            <label className="text-xs">
              Your private key
              <input
                type="text"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                required
                className="w-full h-8 !px-2 text-black !text-base !bg-white !rounded-md outline-none focus:outline-none focus:ring-0 focus:border focus:border-[#3C3C53]"
              />
            </label>
            <button
              type="submit"
              className="text-base bg-[#A55CD6] hover:bg-[#B578DD] px-6 py-2 rounded-xl text-white mt-8"
            >
              {isLoading ? <LoadingSpinner size={20} /> : "Continue"}
            </button>
            <p className="text-sm text-white mt-4">{error}</p>
          </form>
        </div>
      )}
    </div>
  );
};

export default MnemonicInput;
