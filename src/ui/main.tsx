import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// page
import App from "./App.tsx";

// provider
import RecoveryKitProvider from "./context/RecoveryKitProvider.tsx";

// css
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RecoveryKitProvider>
      <App />
    </RecoveryKitProvider>
  </StrictMode>
);
