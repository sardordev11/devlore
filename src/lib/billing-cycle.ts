import "server-only";

import { decryptBillingKey } from "@/lib/billing-key-crypto";
import {
  addDays,
  addMonths,
  BILLING_PLANS,
  getOrderId,
  MAX_FAILED_ATTEMPTS,
} from "@/lib/billing-plans";
import {
  expireSubscription,
  getDueSubscriptions,
  recordFailedRenewal,
  recordRenewal,
  type DueSubscription,
} from "@/lib/db/billing";
import { chargeBillingKey, deleteBillingKey, TossError } from "@/lib/toss";

export interface BillingCycleSummary {
  renewed: number;
  failed: number;
  expired: number;
}

type Outcome = keyof BillingCycleSummary;

// Expires the subscription, then deletes its key at Toss (best effort)
async function expire(sub: DueSubscription): Promise<Outcome> {
  const encrypted = await expireSubscription(sub.id);
  if (encrypted) {
    try {
      await deleteBillingKey(decryptBillingKey(encrypted));
    } catch (error) {
      console.error(`Billing key delete failed for ${sub.id}:`, error);
    }
  }
  return "expired";
}

function getFailure(error: unknown) {
  if (error instanceof TossError) {
    return { failureCode: error.code, failureMessage: error.message };
  }
  return { failureCode: "SERVER", failureMessage: "Renewal charge failed" };
}

async function renew(sub: DueSubscription, now: Date): Promise<Outcome> {
  const { amount, orderName, months } = BILLING_PLANS[sub.plan];
  // Periods follow on from each other, even when a retry succeeds days later
  const periodStart = sub.currentPeriodEnd;
  const periodEnd = addMonths(periodStart, months);
  const orderId = getOrderId(sub.userId, periodStart);

  let paymentKey: string;
  try {
    if (!sub.billingKey || !sub.user.tossCustomerKey) {
      throw new TossError("NO_BILLING_KEY", "No billing key stored", 400);
    }
    const payment = await chargeBillingKey(decryptBillingKey(sub.billingKey), {
      customerKey: sub.user.tossCustomerKey,
      amount,
      orderId,
      orderName,
      customerEmail: sub.user.email,
    });
    if (payment.status !== "DONE") {
      throw new TossError("NOT_DONE", "Payment not completed", 402);
    }
    paymentKey = payment.paymentKey;
  } catch (error) {
    console.error(`Renewal failed for ${sub.id}:`, error);
    const failedAttempts = sub.failedAttempts + 1;
    if (failedAttempts >= MAX_FAILED_ATTEMPTS) return expire(sub);

    await recordFailedRenewal(sub.id, {
      orderId,
      periodStart,
      periodEnd,
      failedAttempts,
      nextRetryAt: addDays(now, 1),
      ...getFailure(error),
    });
    return "failed";
  }

  // Outside the try: a database error here isn't a failed charge. The run
  // logs it and the next run gets the same payment back via the orderId.
  await recordRenewal(sub.id, { orderId, paymentKey, periodStart, periodEnd });
  return "renewed";
}

// Daily cron: renews due subscriptions, retries failed ones and expires
// cancelled or unpaid ones. Charges run one at a time so a slow Toss response
// doesn't fan out, and one subscription's error never stops the run.
export async function runBillingCycle(now: Date): Promise<BillingCycleSummary> {
  const due = await getDueSubscriptions(now);
  const summary: BillingCycleSummary = { renewed: 0, failed: 0, expired: 0 };

  for (const sub of due) {
    try {
      const outcome =
        sub.status === "CANCELED" ? await expire(sub) : await renew(sub, now);
      summary[outcome]++;
    } catch (error) {
      console.error(`Billing cycle failed for ${sub.id}:`, error);
    }
  }
  return summary;
}
