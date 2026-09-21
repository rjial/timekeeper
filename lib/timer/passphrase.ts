"use client";

const STORAGE_KEY = "countdown.console.passphrase.v1";

/**
 * The console's passphrase, held for this browser only. It is never shared
 * state and never leaves the device except as an argument to the write
 * functions, which verify it in Postgres — the check cannot live in this file,
 * because everything in this file ships to the browser.
 */
export function readPassphrase(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function writePassphrase(value: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* Blocked storage: the desk stays unlocked for this session only. */
  }
}

export function clearPassphrase() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to do */
  }
}

/** Postgres raises 28000 when the passphrase does not match. */
export const WRONG_PASSPHRASE = "wrong passphrase";

export function isWrongPassphrase(error: unknown): boolean {
  return error instanceof Error && error.message.includes(WRONG_PASSPHRASE);
}
