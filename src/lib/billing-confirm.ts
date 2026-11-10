import "server-only";

import type { BillingPlan } from "@/generated/prisma/client";
import { decryptBillingKey } from "@/lib/billing-key-crypto";
import { addMonths, BILLING_PLANS, getOrderId } from "@/lib/billing-plans";
import {
  activateSubscription,
  getSubscriptionState,
  replaceBillingKey,
  type SubscriptionState,
} from "@/lib/db/billing";
import {
  chargeBillingKey,
  deleteBillingKey,
  issueBillingKey,
  TossError,
  type TossBilling,
} from "@/lib/toss";

// Query string for the redirect back to /settings/billing
export type ConfirmOutcome = string;

export interface ConfirmUpgradeInput {
  userId: string;
  email: string | null;
  plan: BillingPlan;
  authKey: string;
  // Already checked against the user's stored key by the caller
  customerKey: string;
  now: Date;
}

export interface ConfirmCardChangeInput {
  userId: string;
  authKey: string;
  customerKey: string;
}

// Paid through the current period: a second upgrade would charge twice
export function hasPaidAccess(state: SubscriptionState | null, now: Date) {
  if (!state) return false;
  if (state.status === "ACTIVE" || state.status === "PAST_DUE") return true;
  return state.status === "CANCELED" && state.currentPeriodEnd > now;
}

function getCard(billing: TossBilling) {
  return {
    cardCompany: billing.cardCompany ?? billing.card?.issuerCode ?? null,
    cardNumber: billing.card?.number ?? null,
  };
}

function toErrorQuery(error: unknown): ConfirmOutcome {
  const code = error instanceof TossError ? error.code : "server";
  return `error=${encodeURIComponent(code)}`;
}

// Best effort: a key left at Toss can't be charged without our secret key
async function removeBillingKey(billingKey: string) {
  try {
    await deleteBillingKey(billingKey);
  } catch (error) {
    console.error("Toss billing key delete failed:", error);
  }
}

async function removeStoredBillingKey(encrypted: string | null | undefined) {
  if (!encrypted) return;
  try {
    await removeBillingKey(decryptBillingKey(encrypted));
  } catch (error) {
    console.error("Stored billing key could not be decrypted:", error);
  }
}

// Upgrade: issue the billing key, charge the first period, then activate.
// Any failure after issuing deletes the new key, so no card is kept unpaid.
export async function confirmUpgrade(
  input: ConfirmUpgradeInput,
): Promise<ConfirmOutcome> {
  const state = await getSubscriptionState(input.userId);
  if (hasPaidAccess(state, input.now)) return "error=already_subscribed";

  let billingKey: string | null = null;
  try {
    const billing = await issueBillingKey(input.authKey, input.customerKey);
    billingKey = billing.billingKey;

    const { amount, orderName, months } = BILLING_PLANS[input.plan];
    const orderId = getOrderId(input.userId, input.now);
    const payment = await chargeBillingKey(billingKey, {
      customerKey: input.customerKey,
      amount,
      orderId,
      orderName,
      customerEmail: input.email ?? undefined,
    });
    if (payment.status !== "DONE") {
      throw new TossError("NOT_DONE", "Payment not completed", 402);
    }

    await activateSubscription(input.userId, {
      plan: input.plan,
      amount,
      billingKey,
      ...getCard(billing),
      orderId,
      paymentKey: payment.paymentKey,
      periodStart: input.now,
      periodEnd: addMonths(input.now, months),
    });
  } catch (error) {
    console.error("Billing upgrade failed:", error);
    if (billingKey) await removeBillingKey(billingKey);
    return toErrorQuery(error);
  }

  // An older subscription's key (cancelled and ended, cron not run yet) is replaced
  await removeStoredBillingKey(state?.billingKey);
  return "upgraded=1";
}

// Change card: issue a new key, store it in place of the old one and delete
// the old one at Toss. Nothing is charged.
export async function confirmCardChange(
  input: ConfirmCardChangeInput,
): Promise<ConfirmOutcome> {
  const state = await getSubscriptionState(input.userId);
  if (!state || state.status === "EXPIRED") return "error=no_subscription";

  let billingKey: string | null = null;
  let previous: string | null | undefined;
  try {
    const billing = await issueBillingKey(input.authKey, input.customerKey);
    billingKey = billing.billingKey;

    previous = await replaceBillingKey(input.userId, {
      billingKey,
      ...getCard(billing),
    });
    if (previous === undefined) {
      await removeBillingKey(billingKey);
      return "error=no_subscription";
    }
  } catch (error) {
    console.error("Billing card change failed:", error);
    if (billingKey) await removeBillingKey(billingKey);
    return toErrorQuery(error);
  }

  await removeStoredBillingKey(previous);
  return "card_changed=1";
}
