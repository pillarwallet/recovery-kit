# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Running the project locally

To launch the app locally, run the following command:

1. `npm install`
2. Create a `.env` file in the root directory and add your WalletConnect Project ID:
   ```
   VITE_WALLETCONNECT_PROJECT_ID=your-project-id-here
   ```
   You can get a free Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com)
   
   Optionally, you can disable seed phrase-based onboarding by adding:
   ```
   VITE_DISABLE_SEED_PHRASE_ONBOARDING=true
   ```
   When set to `true`, only WalletConnect onboarding will be available.
3. `npm run dev`

This will launch the electron app locally.

Make sure you have an Etherspot V1 account.

## WalletConnect Setup

This app includes WalletConnect support using wagmi. To use WalletConnect:

1. Register for a free WalletConnect Project ID at [WalletConnect Cloud](https://cloud.walletconnect.com)
2. Add your Project ID to the `.env` file as `VITE_WALLETCONNECT_PROJECT_ID`
3. The Connect Wallet button will appear at the top of the app, allowing users to connect their wallets via WalletConnect

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ["./tsconfig.node.json", "./tsconfig.app.json"],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from "eslint-plugin-react";

export default tseslint.config({
  // Set the react version
  settings: { react: { version: "18.3" } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs["jsx-runtime"].rules,
  },
});
```
