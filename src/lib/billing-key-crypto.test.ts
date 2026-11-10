import { randomBytes } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  decryptBillingKey,
  encryptBillingKey,
  hashBillingKey,
} from "@/lib/billing-key-crypto";

const BILLING_KEY = "Z_t5vOvQxrj4499PeiJcjen28-V2RyqgYTwN44Rdzk0=";

beforeEach(() => {
  vi.stubEnv("BILLING_KEY_SECRET", randomBytes(32).toString("base64"));
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// Flips one byte of the base64 part at `index` ("iv.tag.data")
function tamper(stored: string, index: number) {
  const parts = stored.split(".");
  const bytes = Buffer.from(parts[index], "base64");
  bytes[0] ^= 0xff;
  parts[index] = bytes.toString("base64");
  return parts.join(".");
}

describe("encryptBillingKey / decryptBillingKey", () => {
  it("round trips", () => {
    const stored = encryptBillingKey(BILLING_KEY);

    expect(stored).not.toContain(BILLING_KEY);
    expect(stored.split(".")).toHaveLength(3);
    expect(decryptBillingKey(stored)).toBe(BILLING_KEY);
  });

  it("gives a different ciphertext each call", () => {
    expect(encryptBillingKey(BILLING_KEY)).not.toBe(
      encryptBillingKey(BILLING_KEY),
    );
  });

  it("throws on tampered data, tag or iv", () => {
    const stored = encryptBillingKey(BILLING_KEY);

    for (const index of [0, 1, 2]) {
      expect(() => decryptBillingKey(tamper(stored, index))).toThrow();
    }
  });

  it("throws on a malformed value", () => {
    expect(() => decryptBillingKey("not-encrypted")).toThrow();
  });

  it("throws when decrypted with another key", () => {
    const stored = encryptBillingKey(BILLING_KEY);
    vi.stubEnv("BILLING_KEY_SECRET", randomBytes(32).toString("base64"));

    expect(() => decryptBillingKey(stored)).toThrow();
  });

  it.each([undefined, "", randomBytes(16).toString("base64")])(
    "throws when the secret isn't 32 bytes (%j)",
    (secret) => {
      vi.stubEnv("BILLING_KEY_SECRET", secret);

      expect(() => encryptBillingKey(BILLING_KEY)).toThrow(/32 bytes/);
    },
  );
});

describe("hashBillingKey", () => {
  it("is a stable SHA-256 hex digest", () => {
    const hash = hashBillingKey(BILLING_KEY);

    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashBillingKey(BILLING_KEY)).toBe(hash);
    expect(hashBillingKey(`${BILLING_KEY}x`)).not.toBe(hash);
  });
});
