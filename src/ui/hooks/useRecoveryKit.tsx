import { useCallback, useContext } from "react";

// provider
import { RecoveryKitContext } from "../context/RecoveryKitProvider";

export const useRecoveryKit = () => {
  const context = useContext(RecoveryKitContext);

  if (!context) {
    throw new Error(
      "useRecoveryKit must be used within a <RecoveryKitProvider />"
    );
  }

  return context;
};

/**
 * The key that signs transactions: the private key the user entered,
 * otherwise the one derived from their seed phrase.
 */
export const useSignerKey = () => {
  const { privateKey, seedPhrase } = useRecoveryKit();

  return useCallback(
    async (): Promise<string> =>
      privateKey ?? (await window.electron.getPrivateKey(seedPhrase)),
    [privateKey, seedPhrase]
  );
};

export const useArchanovaAddress = () => {
  const { archanovaAddress } = useRecoveryKit();
  return archanovaAddress;
};
