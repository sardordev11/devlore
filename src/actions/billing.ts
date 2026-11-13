"use server";

import { refresh } from "next/cache";

import { getSessionUserId, SIGNED_OUT_ERROR } from "@/lib/action-helpers";
import {
  cancelSubscription as cancelSubscriptionQuery,
  getOrCreateCustomerKey,
  resumeSubscription as resumeSubscriptionQuery,
} from "@/lib/db/billing";
import type { ActionResult } from "@/types/actions";
import type { BillingOverview } from "@/types/billing";

// The user's Toss customerKey for the card window, created on first use
export async function getCustomerKey(): Promise<ActionResult<string>> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: SIGNED_OUT_ERROR };

  try {
    return { success: true, data: await getOrCreateCustomerKey(userId) };
  } catch (error) {
    console.error("Get customer key failed:", error);
    return { success: false, error: "Couldn't start checkout. Please try again." };
  }
}

// Stops renewals; Pro and the billing key stay until currentPeriodEnd, when
// the cron expires the subscription
export async function cancelSubscription(): Promise<ActionResult<BillingOverview>> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: SIGNED_OUT_ERROR };

  try {
    const subscription = await cancelSubscriptionQuery(userId);
    if (!subscription) return { success: false, error: "No active subscription" };

    refresh();
    return { success: true, data: subscription };
  } catch (error) {
    console.error("Cancel subscription failed:", error);
    return {
      success: false,
      error: "Couldn't cancel your subscription. Please try again.",
    };
  }
}

// Undoes a cancel before the period ends, while the billing key still exists
export async function resumeSubscription(): Promise<ActionResult<BillingOverview>> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: SIGNED_OUT_ERROR };

  try {
    const subscription = await resumeSubscriptionQuery(userId, new Date());
    if (!subscription) {
      return {
        success: false,
        error: "This subscription can't be resumed. Upgrade again to restart Pro.",
      };
    }

    refresh();
    return { success: true, data: subscription };
  } catch (error) {
    console.error("Resume subscription failed:", error);
    return {
      success: false,
      error: "Couldn't resume your subscription. Please try again.",
    };
  }
}
