import crypto from "crypto";
import { env } from "../config/env.js";

/**
 * AES-256-GCM: authenticated encryption (the industry-standard choice for
 * encrypting a secret at rest) - forging or tampering with a stored value
 * without the key is not just hard to read, it fails to decrypt outright.
 *
 * Used exclusively to store the Meta access token at rest in MongoDB
 * (see modules/social-media/services/MetaConnectionService.js). The key
 * lives only in TOKEN_ENCRYPTION_KEY (server-side env), is never sent to
 * the client, and the plaintext token is only ever held transiently while
 * a backend Meta Graph API call is in flight.
 */
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recommended IV length for GCM

function getKey() {
  const key = Buffer.from(env.tokenEncryptionKey, "hex");
  if (key.length !== 32) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes (64 hex characters)",
    );
  }
  return key;
}

// Encrypts one string, returning "iv:authTag:ciphertext" (each base64) -
// everything needed to decrypt later, nothing else.
export function encrypt(plainText) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

export function decrypt(payload) {
  const [ivB64, authTagB64, dataB64] = String(payload).split(":");
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const data = Buffer.from(dataB64, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
}
