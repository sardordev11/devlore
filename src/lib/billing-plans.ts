import type { BillingPlan } from "@/generated/prisma/client";

interface BillingPlanConfig {
  // KRW charged per period
  amount: number;
  orderName: string;
  months: number;
}

// Placeholder KRW amounts until pricing is decided (integration plan, section 0)
export const BILLING_PLANS = {
  MONTHLY: { amount: 11000, orderName: "DevLore Pro (Monthly)", months: 1 },
  YEARLY: { amount: 99000, orderName: "DevLore Pro (Yearly)", months: 12 },
} as const satisfies Record<BillingPlan, BillingPlanConfig>;

// How long a PAST_DUE subscription keeps Pro while renewals are retried
export const GRACE_DAYS = 3;
export const MAX_FAILED_ATTEMPTS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

// UTC, clamped to the month's last day: Jan 31 + 1 month → Feb 28/29, not Mar 3
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

// Deterministic per user and period so a rerun can't charge twice.
// Toss needs 6–64 chars of [A-Za-z0-9_=-]; cuid ids fit.
export function getOrderId(userId: string, periodStart: Date): string {
  const day = periodStart.toISOString().slice(0, 10).replaceAll("-", "");
  return `sub_${userId}_${day}`;
}

export function parseBillingPlan(value: unknown): BillingPlan | null {
  return value === "MONTHLY" || value === "YEARLY" ? value : null;
}
