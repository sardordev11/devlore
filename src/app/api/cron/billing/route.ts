import { NextResponse } from "next/server";

import { apiError } from "@/lib/api-response";
import { runBillingCycle } from "@/lib/billing-cycle";

// Charges run one at a time and Toss can take up to 60s per charge
export const maxDuration = 300;

// Vercel Cron sends "Authorization: Bearer <CRON_SECRET>"
function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return apiError("Unauthorized", 401);
  }

  try {
    const summary = await runBillingCycle(new Date());
    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    console.error("Billing cycle failed:", error);
    return apiError("Billing cycle failed", 500);
  }
}
