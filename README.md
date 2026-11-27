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

Release 1.1.0 was not code-signed. macOS then says “recovery-kit” is damaged and can’t be opened. The download is intact; the app bundle has no valid signature.

Copy `recovery-kit.app` from the disk image into Applications, then run:

```
xattr -cr /Applications/recovery-kit.app
codesign --force --deep --sign - /Applications/recovery-kit.app
```

Open the app from Applications. If macOS says the developer cannot be verified, allow it in System Settings → Privacy & Security.

Releases from 1.1.1 onward are signed during the build, so that damaged-app error does not apply. Removing the remaining unidentified-developer prompt requires Apple notarization. Add these secrets to the macOS release job: `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID`.

## Running on Windows?
These are false positives because the app has not been verified via Windows Store. You can safely ignore these warnings and continue to open the application.
