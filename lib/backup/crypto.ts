"use client";

// Client-side encrypted backup: AES-GCM with a key derived from a farmer-
// chosen passphrase via PBKDF2. There is no backend account/storage system
// here by design (principle: "no account needed beyond a phone-based local
// profile, and all data stays on the device unless the farmer enables
// backup") — "enabling backup" means producing a single encrypted file the
// farmer saves wherever they like (device storage, SD card, their own cloud
// drive via the OS share sheet), not a hosted account on our servers.

const SALT_BYTES = 16;
const IV_BYTES = 12;
const PBKDF2_ITERATIONS = 150_000;

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export interface EncryptedBackup {
  version: 1;
  saltBase64: string;
  ivBase64: string;
  cipherTextBase64: string;
}

function bufToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBuf(b64: string): Uint8Array {
  return new Uint8Array(
    atob(b64)
      .split("")
      .map((c) => c.charCodeAt(0))
  );
}

export async function encryptBackup(data: unknown, passphrase: string): Promise<EncryptedBackup> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(passphrase, salt);
  const plainText = new TextEncoder().encode(JSON.stringify(data));
  const cipherText = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, plainText as BufferSource);
  return {
    version: 1,
    saltBase64: bufToBase64(salt),
    ivBase64: bufToBase64(iv),
    cipherTextBase64: bufToBase64(cipherText),
  };
}

export async function decryptBackup<T>(backup: EncryptedBackup, passphrase: string): Promise<T> {
  const salt = base64ToBuf(backup.saltBase64);
  const iv = base64ToBuf(backup.ivBase64);
  const key = await deriveKey(passphrase, salt);
  const cipherText = base64ToBuf(backup.cipherTextBase64);
  const plainText = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, cipherText as BufferSource);
  return JSON.parse(new TextDecoder().decode(plainText)) as T;
}
