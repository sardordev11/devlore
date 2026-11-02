import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getClientIp,
  rateLimitMessage,
  retryAfterSeconds,
} from "@/lib/rate-limit";

describe("getClientIp", () => {
  it("uses the first x-forwarded-for entry", () => {
    const headers = new Headers({ "x-forwarded-for": " 1.1.1.1 , 2.2.2.2" });
    expect(getClientIp(headers)).toBe("1.1.1.1");
  });

  it("falls back to x-real-ip, then to unknown", () => {
    expect(getClientIp(new Headers({ "x-real-ip": "3.3.3.3" }))).toBe("3.3.3.3");
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});

describe("retryAfterSeconds and rateLimitMessage", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("rounds up to whole seconds and minutes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);

    expect(retryAfterSeconds(90_500)).toBe(91);
    expect(rateLimitMessage(90_500)).toBe(
      "Too many attempts. Please try again in 2 minutes.",
    );
  });

  it("never goes below one second and uses the singular", () => {
    vi.useFakeTimers();
    vi.setSystemTime(10_000);

    expect(retryAfterSeconds(0)).toBe(1);
    expect(rateLimitMessage(0)).toBe(
      "Too many attempts. Please try again in 1 minute.",
    );
  });
});

describe("checkRateLimit", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows the request when Upstash is not configured", async () => {
    // Limiters are created at import time, so load a fresh copy without Upstash
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    vi.resetModules();
    const { checkRateLimit } = await import("@/lib/rate-limit");

    await expect(checkRateLimit("login", "1.1.1.1")).resolves.toEqual({
      success: true,
      remaining: -1,
      reset: 0,
    });
  });
});
