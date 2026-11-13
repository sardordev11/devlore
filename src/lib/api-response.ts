import { NextResponse } from "next/server";

import { rateLimitMessage, retryAfterSeconds } from "@/lib/rate-limit";

// { success: false, error } JSON for API routes; extra adds fields such as upgrade.
export function apiError(
  error: string,
  status: number,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json({ success: false, error, ...extra }, { status });
}

// 429 with the rate-limit message and a Retry-After header in seconds.
export function rateLimitedResponse(reset: number) {
  return NextResponse.json(
    { success: false, error: rateLimitMessage(reset) },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds(reset)) },
    },
  );
}
