import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { hashToken } from "@/lib/tokens";

// A billing key is a reusable charge credential, so it's encrypted at rest
// with AES-256-GCM. Changing BILLING_KEY_SECRET makes stored keys unreadable.
const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;

function getKey() {
  const key = Buffer.from(process.env.BILLING_KEY_SECRET ?? "", "base64");
  if (key.length !== 32) {
    throw new Error("BILLING_KEY_SECRET must be 32 bytes, base64");
  }
  return key;
}

// Stored as "iv.tag.data", each part base64
export function encryptBillingKey(plain: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data]
    .map((part) => part.toString("base64"))
    .join(".");
}

// Throws on tampered data or a wrong key (GCM auth tag check)
export function decryptBillingKey(stored: string): string {
  const parts = stored.split(".");
  if (parts.length !== 3) throw new Error("Invalid encrypted billing key");

  const [iv, tag, data] = parts.map((part) => Buffer.from(part, "base64"));
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8",
  );
}

// SHA-256 hex for Subscription.billingKeyHash, so the BILLING_DELETED webhook
// can find the row without decrypting every key
export function hashBillingKey(plain: string): string {
  return hashToken(plain);
}
