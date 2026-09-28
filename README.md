# Recovery Kit
Recovery Kit is a small tool that allows you to transfer assets contained within, now decommissioned, services from Pillar and Etherspot.

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
