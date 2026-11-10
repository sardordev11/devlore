import "server-only";

import { randomUUID } from "node:crypto";

import type {
  BillingPlan,
  SubscriptionStatus,
} from "@/generated/prisma/client";
import { encryptBillingKey, hashBillingKey } from "@/lib/billing-key-crypto";
import { prisma } from "@/lib/prisma";
import type { BillingOverview, UserPlan } from "@/types/billing";

const BILLING_OVERVIEW_SELECT = {
  plan: true,
  status: true,
  cardCompany: true,
  cardNumber: true,
  amount: true,
  currentPeriodEnd: true,
} as const;

// Every status but EXPIRED keeps Pro (CANCELED until the period ends,
// PAST_DUE during the grace period). isPro is written in the same transaction.
export function isProStatus(status: SubscriptionStatus) {
  return status !== "EXPIRED";
}

// The source of truth for server-side gating; session.user.isPro is UI only
export async function getUserPlan(userId: string): Promise<UserPlan | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isPro: true,
      _count: { select: { items: true, collections: true } },
    },
  });
  if (!user) return null;

  return {
    isPro: user.isPro,
    itemCount: user._count.items,
    collectionCount: user._count.collections,
  };
}

// A random customerKey rather than the user id, since Toss advises against
// guessable values. "dl_" + UUID is 39 chars and includes "_" as Toss requires.
export async function getOrCreateCustomerKey(userId: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { tossCustomerKey: true },
  });
  if (user.tossCustomerKey) return user.tossCustomerKey;

  // Only set when still empty, so two parallel requests end up with one key
  await prisma.user.updateMany({
    where: { id: userId, tossCustomerKey: null },
    data: { tossCustomerKey: `dl_${randomUUID()}` },
  });
  const updated = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { tossCustomerKey: true },
  });
  return updated.tossCustomerKey!;
}

export function getBillingOverview(
  userId: string,
): Promise<BillingOverview | null> {
  return prisma.subscription.findUnique({
    where: { userId },
    select: BILLING_OVERVIEW_SELECT,
  });
}

// Renewals, retries and cancelled periods that have ended, oldest first
export function getDueSubscriptions(now: Date, take = 50) {
  return prisma.subscription.findMany({
    where: {
      OR: [
        { status: "ACTIVE", currentPeriodEnd: { lte: now } },
        { status: "PAST_DUE", nextRetryAt: { lte: now } },
        { status: "CANCELED", currentPeriodEnd: { lte: now } },
      ],
    },
    include: { user: { select: { email: true, tossCustomerKey: true } } },
    orderBy: { currentPeriodEnd: "asc" },
    take,
  });
}

export type DueSubscription = Awaited<
  ReturnType<typeof getDueSubscriptions>
>[number];

export interface ActivateSubscriptionInput {
  plan: BillingPlan;
  amount: number;
  // Plain key from Toss; encrypted and hashed here before it's stored
  billingKey: string;
  cardCompany: string | null;
  cardNumber: string | null;
  orderId: string;
  paymentKey: string;
  periodStart: Date;
  periodEnd: Date;
}

// After the first charge succeeds: (re)starts the subscription and logs the payment
export function activateSubscription(
  userId: string,
  input: ActivateSubscriptionInput,
) {
  const subscription = {
    plan: input.plan,
    status: "ACTIVE" as const,
    billingKey: encryptBillingKey(input.billingKey),
    billingKeyHash: hashBillingKey(input.billingKey),
    cardCompany: input.cardCompany,
    cardNumber: input.cardNumber,
    amount: input.amount,
    currentPeriodStart: input.periodStart,
    currentPeriodEnd: input.periodEnd,
    failedAttempts: 0,
    nextRetryAt: null,
  };

  return prisma.$transaction(async (tx) => {
    const saved = await tx.subscription.upsert({
      where: { userId },
      create: { userId, ...subscription },
      update: subscription,
      select: BILLING_OVERVIEW_SELECT,
    });
    await tx.payment.create({
      data: {
        userId,
        orderId: input.orderId,
        paymentKey: input.paymentKey,
        plan: input.plan,
        amount: input.amount,
        status: "DONE",
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
      },
    });
    await tx.user.update({
      where: { id: userId },
      data: { isPro: isProStatus(saved.status) },
    });
    return saved;
  });
}

export interface RenewalInput {
  orderId: string;
  paymentKey: string;
  periodStart: Date;
  periodEnd: Date;
}

// A renewal charge succeeded: next period, failures cleared. The payment row is
// upserted because a failed attempt for the same period shares its orderId.
export function recordRenewal(subscriptionId: string, input: RenewalInput) {
  return prisma.$transaction(async (tx) => {
    const sub = await tx.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: "ACTIVE",
        currentPeriodStart: input.periodStart,
        currentPeriodEnd: input.periodEnd,
        failedAttempts: 0,
        nextRetryAt: null,
      },
      select: { userId: true, plan: true, amount: true, status: true },
    });
    const payment = {
      paymentKey: input.paymentKey,
      plan: sub.plan,
      amount: sub.amount,
      status: "DONE" as const,
      failureCode: null,
      failureMessage: null,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
    };
    await tx.payment.upsert({
      where: { orderId: input.orderId },
      create: { userId: sub.userId, orderId: input.orderId, ...payment },
      update: payment,
    });
    await tx.user.update({
      where: { id: sub.userId },
      data: { isPro: isProStatus(sub.status) },
    });
  });
}

export interface FailedRenewalInput {
  orderId: string;
  periodStart: Date;
  periodEnd: Date;
  failedAttempts: number;
  nextRetryAt: Date;
  failureCode: string;
  failureMessage: string;
}

// A renewal charge failed: PAST_DUE (still Pro) until the next retry
export function recordFailedRenewal(
  subscriptionId: string,
  input: FailedRenewalInput,
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.payment.findUnique({
      where: { orderId: input.orderId },
      select: { status: true },
    });
    // Never turn a paid period into a failed one
    if (existing?.status === "DONE") {
      throw new Error(`Payment ${input.orderId} is already paid`);
    }

    const sub = await tx.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: "PAST_DUE",
        failedAttempts: input.failedAttempts,
        nextRetryAt: input.nextRetryAt,
      },
      select: { userId: true, plan: true, amount: true, status: true },
    });
    const failure = {
      status: "FAILED" as const,
      failureCode: input.failureCode,
      failureMessage: input.failureMessage,
    };
    await tx.payment.upsert({
      where: { orderId: input.orderId },
      create: {
        userId: sub.userId,
        orderId: input.orderId,
        plan: sub.plan,
        amount: sub.amount,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        ...failure,
      },
      update: failure,
    });
    await tx.user.update({
      where: { id: sub.userId },
      data: { isPro: isProStatus(sub.status) },
    });
  });
}

// Ends Pro. Returns the encrypted billing key it cleared (so the caller can
// delete it at Toss), or null when there was none.
export function expireSubscription(subscriptionId: string) {
  return prisma.$transaction(async (tx) => {
    const previous = await tx.subscription.findUniqueOrThrow({
      where: { id: subscriptionId },
      select: { billingKey: true },
    });
    const sub = await tx.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: "EXPIRED",
        billingKey: null,
        billingKeyHash: null,
        nextRetryAt: null,
      },
      select: { userId: true, status: true },
    });
    await tx.user.update({
      where: { id: sub.userId },
      data: { isPro: isProStatus(sub.status) },
    });
    return previous.billingKey;
  });
}

// Stops renewals but keeps Pro (and the billing key, for resume) until the
// period ends. Returns null when there's nothing to cancel.
export function cancelSubscription(
  userId: string,
): Promise<BillingOverview | null> {
  return setStatusIf(userId, ["ACTIVE", "PAST_DUE"], "CANCELED", {});
}

// Undoes a cancel before the period ends, as long as the billing key is kept
export function resumeSubscription(
  userId: string,
  now: Date,
): Promise<BillingOverview | null> {
  return setStatusIf(userId, ["CANCELED"], "ACTIVE", {
    billingKey: { not: null },
    currentPeriodEnd: { gt: now },
  });
}

async function setStatusIf(
  userId: string,
  from: SubscriptionStatus[],
  to: SubscriptionStatus,
  extraWhere: { billingKey?: { not: null }; currentPeriodEnd?: { gt: Date } },
) {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.subscription.updateMany({
      where: { userId, status: { in: from }, ...extraWhere },
      data: { status: to, nextRetryAt: null },
    });
    if (count === 0) return null;

    await tx.user.update({
      where: { id: userId },
      data: { isPro: isProStatus(to) },
    });
    return tx.subscription.findUnique({
      where: { userId },
      select: BILLING_OVERVIEW_SELECT,
    });
  });
}

// BILLING_DELETED webhook: the key is gone at Toss, so clear it and stop
// renewals; Pro lasts until the period ends. Returns false for unknown keys.
export function handleBillingDeleted(billingKey: string) {
  return prisma.$transaction(async (tx) => {
    const sub = await tx.subscription.findUnique({
      where: { billingKeyHash: hashBillingKey(billingKey) },
      select: { id: true, userId: true, status: true },
    });
    if (!sub) return false;

    const status: SubscriptionStatus =
      sub.status === "EXPIRED" ? "EXPIRED" : "CANCELED";
    await tx.subscription.update({
      where: { id: sub.id },
      data: { status, billingKey: null, billingKeyHash: null, nextRetryAt: null },
    });
    await tx.user.update({
      where: { id: sub.userId },
      data: { isPro: isProStatus(status) },
    });
    return true;
  });
}
