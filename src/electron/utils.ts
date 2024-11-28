/* eslint-disable @typescript-eslint/no-explicit-any */
import { ipcMain, WebContents, WebFrameMain } from "electron";
import { BigNumberish } from "ethers";
import { pathToFileURL } from "url";
import { getUIPath } from "./pathResolver.js";

export function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

export const processBigNumber = (val: BigNumberish): number =>
  Number(val.toString());

export function ipcMainHandle<Key extends keyof EventPayloadMapping>(
  key: Key,
  handler: (...args: any[]) => EventPayloadMapping[Key]
) {
  ipcMain.handle(key, async (event, ...args) => {
    validateEventFrame(event.senderFrame);
    const result = await handler(...args);
    return result;
  });
}

export function ipcMainOn<Key extends keyof EventPayloadMapping>(
  key: Key,
  handler: (payload: EventPayloadMapping[Key]) => void
) {
  ipcMain.on(key, (event, payload) => {
    validateEventFrame(event.senderFrame);
    return handler(payload);
  });
}

export function ipcWebContentsSend<Key extends keyof EventPayloadMapping>(
  key: Key,
  webContents: WebContents,
  payload: EventPayloadMapping[Key]
) {
  webContents.send(key, payload);
}

export function validateEventFrame(frame: WebFrameMain) {
  if (isDev() && new URL(frame.url).host === "localhost:5123") {
    return;
  }
  if (frame.url !== pathToFileURL(getUIPath()).toString()) {
    throw new Error("Malicious event");
  }
}

export const ETHERSPOT_V1_BALANCES_HELPER_V2_ADDRESS =
  "0xe5A160F89f330cc933816E896a3F36376DE0a835";

export const ETHERSPOT_V1_PERSONAL_ACCOUNT_REGISTRY_ADDRESS =
  "0x7EB3A038F25B9F32f8e19A7F0De83D4916030eFa";
