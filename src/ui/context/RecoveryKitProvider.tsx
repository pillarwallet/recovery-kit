import React, { ReactNode, createContext, useState } from "react";

interface RecoveryKitContextType {
  accountAddress: string | null;
  setAccountAddress: React.Dispatch<React.SetStateAction<string | null>>;
  seedPhrase: string[];
  setSeedPhrase: React.Dispatch<React.SetStateAction<string[]>>;
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  balances: BalancesByChain;
  setBalances: React.Dispatch<React.SetStateAction<BalancesByChain>>;
  contract: ContractsType | undefined;
  setContract: React.Dispatch<React.SetStateAction<ContractsType | undefined>>;
  selectedAsset: BalanceInfo | AddedAssets | undefined;
  setSelectedAsset: React.Dispatch<
    React.SetStateAction<BalanceInfo | AddedAssets | undefined>
  >;
  EOAWalletAddress: string | null;
  setEOAWalletAddress: React.Dispatch<React.SetStateAction<string | null>>;
}

export const RecoveryKitContext = createContext<
  RecoveryKitContextType | undefined
>(undefined);

const RecoveryKitProvider = ({ children }: { children: ReactNode }) => {
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [seedPhrase, setSeedPhrase] = useState<string[]>(Array(12).fill(""));
  const [balances, setBalances] = useState<BalancesByChain>({});
  const [step, setStep] = useState<number>(1);
  const [contract, setContract] = useState<ContractsType>();
  const [selectedAsset, setSelectedAsset] = useState<
    BalanceInfo | AddedAssets | undefined
  >();
  const [EOAWalletAddress, setEOAWalletAddress] = useState<string | null>(null);

  return (
    <RecoveryKitContext.Provider
      value={{
        accountAddress,
        setAccountAddress,
        seedPhrase,
        setSeedPhrase,
        step,
        setStep,
        balances,
        setBalances,
        contract,
        setContract,
        selectedAsset,
        setSelectedAsset,
        EOAWalletAddress,
        setEOAWalletAddress,
      }}
    >
      {children}
    </RecoveryKitContext.Provider>
  );
};

export default RecoveryKitProvider;
