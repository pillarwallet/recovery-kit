"use strict";

const { spawnSync } = require("node:child_process");
const path = require("node:path");

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  return {
    status: result.status,
    output: `${result.stdout || ""}${result.stderr || ""}`,
    error: result.error,
  };
}

function signatureDetails(appPath) {
  return run("codesign", ["-dv", "--verbose=4", appPath]).output;
}

function isStrictlyValid(appPath) {
  return run("codesign", ["--verify", "--deep", "--strict", appPath]).status === 0;
}

/**
 * Electron ships a linker ad-hoc signature that does not seal the .app bundle.
 * Without a Developer ID, electron-builder skips signing, `codesign --verify`
 * fails with "code has no resources but signature indicates they must be present",
 * and macOS tells users the app is damaged.
 *
 * A real Developer ID signature is left untouched so notarization can follow.
 * Otherwise the bundle is sealed with an ad-hoc signature.
 */
async function afterSignMac(context) {
  if (context.electronPlatformName !== "darwin") {
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(context.appOutDir, `${appName}.app`);
  const details = signatureDetails(appPath);

  if (run("codesign", ["-dv", appPath]).error) {
    throw new Error(`codesign is required to sign ${appPath}, but it is not available`);
  }

  if (/^Authority=/m.test(details)) {
    if (!isStrictlyValid(appPath)) {
      throw new Error(
        `macOS code signature for ${appPath} is invalid. Gatekeeper reports this as a damaged app.\n${details}`,
      );
    }
    console.log(`[afterSign] ${appName}.app has a Developer ID signature`);
    return;
  }

  if (isStrictlyValid(appPath) && /Sealed Resources version=/m.test(details)) {
    console.log(`[afterSign] ${appName}.app already has a valid ad-hoc signature`);
    return;
  }

  console.log(
    `[afterSign] sealing ${appPath} with an ad-hoc signature so macOS does not report it as damaged`,
  );

  const signed = run("codesign", ["--force", "--deep", "--sign", "-", appPath]);
  if (signed.status !== 0) {
    throw new Error(`codesign failed for ${appPath}\n${signed.output}`);
  }

  const verified = run("codesign", ["--verify", "--deep", "--strict", "--verbose=2", appPath]);
  if (verified.status !== 0) {
    throw new Error(`codesign --verify failed for ${appPath}\n${verified.output}`);
  }

  console.log(`[afterSign] ${appName}.app signature is valid`);
}

module.exports = afterSignMac;
module.exports.default = afterSignMac;
