# Recovery Kit
Recovery Kit is a small tool that allows you to transfer assets contained within, now decommissioned, services from Pillar and Etherspot.

## Supported accounts
| Account | Chains |
| --- | --- |
| Etherspot V1 | Ethereum, Polygon, Optimism, Arbitrum, BNB Chain, Gnosis |
| Archanova | Ethereum |
| PillarX | Ethereum, Polygon, Optimism, Arbitrum, BNB Chain, Gnosis, Base |

### PillarX
PillarX accounts are Etherspot Modular accounts owned by the wallet you signed in to PillarX with. Enter that wallet's private key (or 12-word seed phrase) and Recovery Kit shows the PillarX account address and its assets.

- If you signed in to PillarX with email or a social login, export your private key from PillarX before it shuts down.
- Transfers are sent straight to the ERC-4337 EntryPoint by your EOA Wallet, without a bundler or paymaster, so your EOA Wallet needs enough of the chain's native token to pay for gas. An account that was never deployed on a chain is deployed as part of its first transfer.
- If PillarX showed your wallet's own address as your account (EIP-7702 mode), your assets are held by the wallet itself: import the private key into any wallet app to access them.

## Download
Head over to https://github.com/pillarwallet/recovery-kit/releases and download the latest version for your device.

## Running on Mac?

Recovery Kit is not yet notarized by Apple, so the first time you open it macOS shows:

> “recovery-kit” Not Opened. Apple could not verify “recovery-kit” is free of malware that may harm your Mac or compromise your privacy.

The download is intact. To open it:

1. Drag `recovery-kit` from the disk image into Applications.
2. Open it from Applications. When the warning appears, click **Done** (not Move to Trash).
3. Open **System Settings → Privacy & Security** and scroll down to **Security**. Next to “recovery-kit was blocked to protect your Mac”, click **Open Anyway**.
4. Confirm with your password or Touch ID, then click **Open Anyway** again.

You only need to do this once. Control-clicking the app and choosing Open no longer bypasses this warning on macOS 15 (Sequoia) and later.

Alternatively, after step 1, run this in Terminal and then open the app normally:

```
xattr -dr com.apple.quarantine /Applications/recovery-kit.app
```

Only do this for a copy downloaded from https://github.com/pillarwallet/recovery-kit/releases.

### “recovery-kit” is damaged and can’t be opened

Release 1.1.0 was not code-signed and shows this error instead. Use the latest release, or copy `recovery-kit.app` into Applications and run:

```
xattr -cr /Applications/recovery-kit.app
codesign --force --deep --sign - /Applications/recovery-kit.app
```

### For maintainers

Removing the warning for everyone requires signing with an Apple Developer ID and notarizing the build. Add these secrets to the macOS release job: `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID`.

## Running on Windows?
These are false positives because the app has not been verified via Windows Store. You can safely ignore these warnings and continue to open the application.
