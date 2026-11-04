import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createFileKey,
  getFileKey,
  getFileUrl,
  isOwnedFileKey,
} from "@/lib/r2";

beforeEach(() => {
  vi.stubEnv("R2_PUBLIC_URL", "https://pub-123.r2.dev/");
});

describe("createFileKey", () => {
  it("puts a random name under the user's prefix", () => {
    const key = createFileKey("user-1", ".png");

    expect(key).toMatch(/^users\/user-1\/[0-9a-f-]{36}\.png$/);
    expect(createFileKey("user-1", ".png")).not.toBe(key);
  });
});

describe("isOwnedFileKey", () => {
  it("accepts keys created for the user", () => {
    expect(isOwnedFileKey("user-1", createFileKey("user-1", ".pdf"))).toBe(true);
  });

  it("rejects other users' keys and path tricks", () => {
    const key = createFileKey("user-2", ".pdf");
    expect(isOwnedFileKey("user-1", key)).toBe(false);
    expect(isOwnedFileKey("user-1", "users/user-1/../user-2/a.pdf")).toBe(false);
    expect(isOwnedFileKey("user-1", "users/user-1/nested/a.pdf")).toBe(false);
    expect(isOwnedFileKey("user-1", "users/user-12/a.pdf")).toBe(false);
    expect(isOwnedFileKey("user-1", "users/user-1/")).toBe(false);
  });
});

describe("getFileUrl and getFileKey", () => {
  it("round-trips a key through the public URL", () => {
    const url = getFileUrl("users/user-1/a.png");

    expect(url).toBe("https://pub-123.r2.dev/users/user-1/a.png");
    expect(getFileKey(url)).toBe("users/user-1/a.png");
  });

  it("returns null for URLs outside the bucket", () => {
    expect(getFileKey("https://evil.example.com/users/user-1/a.png")).toBeNull();
  });
});
