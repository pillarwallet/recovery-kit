import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// page
import App from "./App.tsx";

// providers
import RecoveryKitProvider from "./context/RecoveryKitProvider.tsx";
import { WagmiProvider } from "./providers/WagmiProvider.tsx";

// css
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WagmiProvider>
      <RecoveryKitProvider>
        <App />
      </RecoveryKitProvider>
    </WagmiProvider>
  </StrictMode>
);
