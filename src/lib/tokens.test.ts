import { describe, expect, it } from "vitest";

import { createToken, hashToken } from "@/lib/tokens";

describe("createToken", () => {
  it("returns a 32-byte base64url token", () => {
    const token = createToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("returns a different token each call", () => {
    expect(createToken()).not.toBe(createToken());
  });
});

describe("hashToken", () => {
  it("returns the SHA-256 hex digest", () => {
    expect(hashToken("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("is deterministic and differs from the token", () => {
    const token = createToken();
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toBe(token);
  });
});
