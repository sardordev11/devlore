import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

// Without Upstash configured, limiting is skipped (fails open)
function createLimiter(prefix: string, tokens: number, window: Duration) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    prefix: `ratelimit:${prefix}`,
    // Allow the request if Upstash doesn't answer in time
    timeout: 2000,
  });
}

const LIMITERS = {
  login: createLimiter("login", 5, "15 m"),
  register: createLimiter("register", 3, "1 h"),
  forgotPassword: createLimiter("forgot-password", 3, "1 h"),
  resetPassword: createLimiter("reset-password", 5, "15 m"),
  resendVerification: createLimiter("resend-verification", 3, "15 m"),
};

export type RateLimitName = keyof typeof LIMITERS;

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  // Unix timestamp (ms) when the window resets
  reset: number;
}

const ALLOWED: RateLimitResult = { success: true, remaining: -1, reset: 0 };

export async function checkRateLimit(
  name: RateLimitName,
  identifier: string,
): Promise<RateLimitResult> {
  const limiter = LIMITERS[name];
  if (!limiter) return ALLOWED;

  try {
    const { success, remaining, reset } = await limiter.limit(identifier);
    return { success, remaining, reset };
  } catch (error) {
    console.error(`Rate limit check "${name}" failed:`, error);
    return ALLOWED;
  }
}

// First x-forwarded-for entry is the client on Vercel
export function getClientIp(requestHeaders: Headers) {
  return (
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

// For server actions, which have no Request object
export async function getRequestIp() {
  return getClientIp(await headers());
}

export function retryAfterSeconds(reset: number) {
  return Math.max(1, Math.ceil((reset - Date.now()) / 1000));
}

export function rateLimitMessage(reset: number) {
  const minutes = Math.ceil(retryAfterSeconds(reset) / 60);
  return `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}
