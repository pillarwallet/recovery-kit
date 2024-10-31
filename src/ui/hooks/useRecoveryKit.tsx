import { useContext } from "react";
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
