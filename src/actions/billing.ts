"use server";

import { refresh } from "next/cache";

import { auth } from "@/auth";
import {
  cancelSubscription as cancelSubscriptionQuery,
  getOrCreateCustomerKey,
  resumeSubscription as resumeSubscriptionQuery,
} from "@/lib/db/billing";
import type { BillingOverview } from "@/types/billing";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const SIGNED_OUT = "You must be signed in";

// The user's Toss customerKey for the card window, created on first use
export async function getCustomerKey(): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: SIGNED_OUT };

  try {
    return { success: true, data: await getOrCreateCustomerKey(session.user.id) };
  } catch (error) {
    console.error("Get customer key failed:", error);
    return { success: false, error: "Couldn't start checkout. Please try again." };
  }
}

// Stops renewals; Pro and the billing key stay until currentPeriodEnd, when
// the cron expires the subscription
export async function cancelSubscription(): Promise<ActionResult<BillingOverview>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: SIGNED_OUT };

  try {
    const subscription = await cancelSubscriptionQuery(session.user.id);
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
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: SIGNED_OUT };

  try {
    const subscription = await resumeSubscriptionQuery(session.user.id, new Date());
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
