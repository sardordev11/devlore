import type { BillingPlan } from "@/generated/prisma/client";
import type { BillingDetails } from "@/types/billing";

// Pure and client-safe: how /settings/billing presents a subscription.

// What the page offers:
// free     → Upgrade (no subscription, expired, or cancelled and ended)
// active   → Change card, Cancel
// past_due → Change card, Cancel (renewal failed, retrying)
// canceled → Resume, or Change card first when Toss deleted the key
export type BillingView = "free" | "active" | "past_due" | "canceled";

export function getBillingView(
  details: Pick<BillingDetails, "status" | "currentPeriodEnd"> | null,
  now: Date,
): BillingView {
  if (!details) return "free";
  switch (details.status) {
    case "ACTIVE":
      return "active";
    case "PAST_DUE":
      return "past_due";
    case "CANCELED":
      // Until the cron expires it, an ended cancelled period is already free
      return details.currentPeriodEnd > now ? "canceled" : "free";
    default:
      return "free";
  }
}

// Where every "Upgrade" link goes: plan picker, then the Toss card window
export const UPGRADE_PATH = "/upgrade";

// The page's monthly/yearly switch (lowercase, as on the homepage) → BillingPlan
export function toBillingPlan(period: "monthly" | "yearly"): BillingPlan {
  return period === "yearly" ? "YEARLY" : "MONTHLY";
}

export const PLAN_LABELS = {
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
} as const satisfies Record<BillingPlan, string>;

export const PLAN_PERIODS = {
  MONTHLY: "month",
  YEARLY: "year",
} as const satisfies Record<BillingPlan, string>;

const KRW = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
});

// ₩11,000
export function formatKrw(amount: number) {
  return KRW.format(amount);
}

// Toss sends this to the fail URL when the card window is closed
export const CARD_WINDOW_CLOSED_CODES = ["PAY_PROCESS_CANCELED", "USER_CANCEL"];

export function isCardWindowClosed(code: string) {
  return CARD_WINDOW_CLOSED_CODES.includes(code);
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "That checkout link isn't valid. Please start again.",
  rate_limited: "Too many attempts. Please wait a few minutes and try again.",
  already_subscribed: "You already have Pro, so nothing was charged.",
  no_subscription: "There's no subscription to update the card for.",
  NOT_DONE: "The payment didn't go through, so nothing was charged.",
  REJECT_CARD_COMPANY: "Your card company declined the card. Try another card.",
  INVALID_CARD_EXPIRATION: "The card's expiry date is wrong or the card has expired.",
  EXCEED_MAX_AMOUNT: "The amount is over your card's limit. Try another card.",
  NOT_SUPPORTED_METHOD: "Card billing isn't available yet. Please try again later.",
};

const GENERIC_ERROR = "Something went wrong with the payment. Please try again.";

// Banner for /settings/billing?error=<code> (our codes or Toss error codes)
export function getBillingMessage(code: string): {
  tone: "neutral" | "error";
  text: string;
} {
  if (isCardWindowClosed(code)) {
    return { tone: "neutral", text: "Card registration cancelled." };
  }
  // Own keys only: the code comes from the URL, so "toString" mustn't match
  const text = Object.hasOwn(ERROR_MESSAGES, code) ? ERROR_MESSAGES[code] : GENERIC_ERROR;
  return { tone: "error", text };
}
