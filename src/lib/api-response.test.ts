import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiError, rateLimitedResponse } from "@/lib/api-response";

describe("apiError", () => {
  it("returns { success: false, error } with the status", async () => {
    const response = apiError("Unauthorized", 401);
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Unauthorized",
    });
  });

  it("adds extra fields to the body", async () => {
    const response = apiError("Upgrade to upload files", 403, { upgrade: true });
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Upgrade to upload files",
      upgrade: true,
    });
  });
});

describe("rateLimitedResponse", () => {
  const NOW = new Date("2026-01-01T00:00:00Z").getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a 429 with the message and Retry-After in seconds", async () => {
    const response = rateLimitedResponse(NOW + 90_000);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("90");
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Too many attempts. Please try again in 2 minutes.",
    });
  });
});
