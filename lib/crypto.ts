import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

/**
 * Symmetric encryption for secret site settings stored in the database.
 *
 * Uses AES-256-GCM. The key is derived (SHA-256) from `SETTINGS_ENCRYPTION_KEY`
 * so any non-empty string works as the master key, though a long random value
 * is strongly recommended. A DB dump alone cannot reveal secrets without this key.
 *
 * Ciphertext format (base64):  iv(12) || authTag(16) || ciphertext
 */

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;

function key(): Buffer {
  const secret = process.env.SETTINGS_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error(
      "SETTINGS_ENCRYPTION_KEY is not set — required to read/write encrypted site settings.",
    );
  }
  // Normalize any input string to a 32-byte key.
  return createHash("sha256").update(secret).digest();
}

/** Whether an encryption key is configured (used to gate the settings UI gracefully). */
export function hasEncryptionKey(): boolean {
  return Boolean(process.env.SETTINGS_ENCRYPTION_KEY);
}

/** Encrypt a plaintext string. Returns base64 `iv||tag||ciphertext`. */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

/**
 * Decrypt a base64 `iv||tag||ciphertext` string produced by {@link encryptSecret}.
 * Returns null if the payload is malformed or fails authentication (e.g. wrong key),
 * so a bad value degrades to "unset" rather than crashing auth/email/storage.
 */
export function decryptSecret(payload: string): string | null {
  try {
    const raw = Buffer.from(payload, "base64");
    if (raw.length < IV_BYTES + TAG_BYTES) return null;
    const iv = raw.subarray(0, IV_BYTES);
    const tag = raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
    const data = raw.subarray(IV_BYTES + TAG_BYTES);
    const decipher = createDecipheriv(ALGORITHM, key(), iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}
