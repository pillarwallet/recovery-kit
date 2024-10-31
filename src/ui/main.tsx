import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import RecoveryKitProvider from "./context/RecoveryKitProvider.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RecoveryKitProvider>
      <App />
    </RecoveryKitProvider>
  </StrictMode>
);
