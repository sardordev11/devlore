import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  activateSubscription,
  cancelSubscription,
  expireSubscription,
  getBillingOverview,
  getDueSubscriptions,
  getOrCreateCustomerKey,
  getUserPlan,
  handleBillingDeleted,
  isProStatus,
  recordFailedRenewal,
  recordRenewal,
  resumeSubscription,
} from "@/lib/db/billing";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    user: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      upsert: vi.fn(),
    },
    payment: {
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock("@/lib/billing-key-crypto", () => ({
  encryptBillingKey: (plain: string) => `enc(${plain})`,
  hashBillingKey: (plain: string) => `hash(${plain})`,
}));

const mockPrisma = vi.mocked(prisma, { deep: true });

const periodStart = new Date("2026-11-10T00:00:00Z");
const periodEnd = new Date("2026-12-10T00:00:00Z");

beforeEach(() => {
  // Interactive transactions run against the same mocked client
  mockPrisma.$transaction.mockImplementation(((fn: (tx: unknown) => unknown) =>
    fn(prisma)) as never);
});

function isProWrites() {
  return mockPrisma.user.update.mock.calls.map(([args]) => args);
}

describe("isProStatus", () => {
  it("keeps Pro for every status but EXPIRED", () => {
    expect(isProStatus("ACTIVE")).toBe(true);
    expect(isProStatus("CANCELED")).toBe(true);
    expect(isProStatus("PAST_DUE")).toBe(true);
    expect(isProStatus("EXPIRED")).toBe(false);
  });
});

describe("getUserPlan", () => {
  it("maps isPro and the counts from one query scoped to the user", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      isPro: true,
      _count: { items: 12, collections: 2 },
    } as never);

    await expect(getUserPlan("user-1")).resolves.toEqual({
      isPro: true,
      itemCount: 12,
      collectionCount: 2,
    });
    expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: {
        isPro: true,
        _count: { select: { items: true, collections: true } },
      },
    });
  });

  it("returns null for an unknown user", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(getUserPlan("missing")).resolves.toBeNull();
  });
});

describe("getOrCreateCustomerKey", () => {
  it("reuses an existing key without writing", async () => {
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      tossCustomerKey: "dl_existing",
    } as never);

    await expect(getOrCreateCustomerKey("user-1")).resolves.toBe("dl_existing");
    expect(mockPrisma.user.updateMany).not.toHaveBeenCalled();
  });

  it("creates a dl_<uuid> key only when none is set", async () => {
    mockPrisma.user.findUniqueOrThrow
      .mockResolvedValueOnce({ tossCustomerKey: null } as never)
      .mockResolvedValueOnce({ tossCustomerKey: "dl_new" } as never);

    await expect(getOrCreateCustomerKey("user-1")).resolves.toBe("dl_new");

    const [args] = mockPrisma.user.updateMany.mock.calls[0];
    expect(args.where).toEqual({ id: "user-1", tossCustomerKey: null });
    expect(args.data.tossCustomerKey).toMatch(
      /^dl_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });
});

describe("getBillingOverview", () => {
  it("looks up the user's subscription", async () => {
    mockPrisma.subscription.findUnique.mockResolvedValue(null);

    await expect(getBillingOverview("user-1")).resolves.toBeNull();
    expect(mockPrisma.subscription.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } }),
    );
  });
});

describe("getDueSubscriptions", () => {
  it("finds due renewals, retries and ended cancellations, 50 by default", async () => {
    const now = new Date("2026-11-10T01:00:00Z");
    mockPrisma.subscription.findMany.mockResolvedValue([]);

    await getDueSubscriptions(now);

    expect(mockPrisma.subscription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { status: "ACTIVE", currentPeriodEnd: { lte: now } },
            { status: "PAST_DUE", nextRetryAt: { lte: now } },
            { status: "CANCELED", currentPeriodEnd: { lte: now } },
          ],
        },
        take: 50,
      }),
    );
  });
});

describe("activateSubscription", () => {
  it("stores the key encrypted and hashed, logs the payment and sets isPro", async () => {
    mockPrisma.subscription.upsert.mockResolvedValue({ status: "ACTIVE" } as never);

    await activateSubscription("user-1", {
      plan: "MONTHLY",
      amount: 11000,
      billingKey: "plain-key",
      cardCompany: "61",
      cardNumber: "4330****",
      orderId: "sub_user-1_20261110",
      paymentKey: "pay_1",
      periodStart,
      periodEnd,
    });

    const [upsert] = mockPrisma.subscription.upsert.mock.calls[0];
    expect(upsert.where).toEqual({ userId: "user-1" });
    expect(upsert.create).toMatchObject({
      userId: "user-1",
      status: "ACTIVE",
      billingKey: "enc(plain-key)",
      billingKeyHash: "hash(plain-key)",
      failedAttempts: 0,
    });
    expect(JSON.stringify(upsert)).not.toContain('"plain-key"');
    expect(mockPrisma.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        orderId: "sub_user-1_20261110",
        status: "DONE",
      }),
    });
    expect(isProWrites()).toEqual([
      { where: { id: "user-1" }, data: { isPro: true } },
    ]);
  });
});

describe("recordRenewal", () => {
  it("moves the period, upserts a DONE payment and keeps isPro", async () => {
    mockPrisma.subscription.update.mockResolvedValue({
      userId: "user-1",
      plan: "MONTHLY",
      amount: 11000,
      status: "ACTIVE",
    } as never);

    await recordRenewal("sub-1", {
      orderId: "order-1",
      paymentKey: "pay_2",
      periodStart,
      periodEnd,
    });

    const [update] = mockPrisma.subscription.update.mock.calls[0];
    expect(update.where).toEqual({ id: "sub-1" });
    expect(update.data).toMatchObject({
      status: "ACTIVE",
      currentPeriodEnd: periodEnd,
      failedAttempts: 0,
      nextRetryAt: null,
    });
    const [upsert] = mockPrisma.payment.upsert.mock.calls[0];
    expect(upsert.where).toEqual({ orderId: "order-1" });
    expect(upsert.update).toMatchObject({ status: "DONE", failureCode: null });
    expect(isProWrites()).toEqual([
      { where: { id: "user-1" }, data: { isPro: true } },
    ]);
  });
});

describe("recordFailedRenewal", () => {
  const input = {
    orderId: "order-1",
    periodStart,
    periodEnd,
    failedAttempts: 1,
    nextRetryAt: new Date("2026-11-11T00:00:00Z"),
    failureCode: "REJECT_CARD_COMPANY",
    failureMessage: "Declined",
  };

  it("marks the subscription PAST_DUE, logs a FAILED payment and keeps isPro", async () => {
    mockPrisma.payment.findUnique.mockResolvedValue(null);
    mockPrisma.subscription.update.mockResolvedValue({
      userId: "user-1",
      plan: "MONTHLY",
      amount: 11000,
      status: "PAST_DUE",
    } as never);

    await recordFailedRenewal("sub-1", input);

    expect(mockPrisma.subscription.update.mock.calls[0][0].data).toEqual({
      status: "PAST_DUE",
      failedAttempts: 1,
      nextRetryAt: input.nextRetryAt,
    });
    const [upsert] = mockPrisma.payment.upsert.mock.calls[0];
    expect(upsert.create).toMatchObject({
      status: "FAILED",
      failureCode: "REJECT_CARD_COMPANY",
    });
    expect(isProWrites()).toEqual([
      { where: { id: "user-1" }, data: { isPro: true } },
    ]);
  });

  it("refuses to mark a paid period as failed", async () => {
    mockPrisma.payment.findUnique.mockResolvedValue({ status: "DONE" } as never);

    await expect(recordFailedRenewal("sub-1", input)).rejects.toThrow(
      "already paid",
    );
    expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });
});

describe("expireSubscription", () => {
  it("clears the key, sets EXPIRED and turns isPro off", async () => {
    mockPrisma.subscription.findUniqueOrThrow.mockResolvedValue({
      billingKey: "enc(key)",
    } as never);
    mockPrisma.subscription.update.mockResolvedValue({
      userId: "user-1",
      status: "EXPIRED",
    } as never);

    await expect(expireSubscription("sub-1")).resolves.toBe("enc(key)");

    expect(mockPrisma.subscription.update.mock.calls[0][0]).toMatchObject({
      where: { id: "sub-1" },
      data: { status: "EXPIRED", billingKey: null, billingKeyHash: null },
    });
    expect(isProWrites()).toEqual([
      { where: { id: "user-1" }, data: { isPro: false } },
    ]);
  });
});

describe("cancelSubscription", () => {
  it("cancels an active or past-due subscription and keeps isPro", async () => {
    mockPrisma.subscription.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.subscription.findUnique.mockResolvedValue({
      status: "CANCELED",
    } as never);

    await expect(cancelSubscription("user-1")).resolves.toEqual({
      status: "CANCELED",
    });
    expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", status: { in: ["ACTIVE", "PAST_DUE"] } },
      data: { status: "CANCELED", nextRetryAt: null },
    });
    expect(isProWrites()).toEqual([
      { where: { id: "user-1" }, data: { isPro: true } },
    ]);
  });

  it("returns null without touching isPro when there's nothing to cancel", async () => {
    mockPrisma.subscription.updateMany.mockResolvedValue({ count: 0 });

    await expect(cancelSubscription("user-1")).resolves.toBeNull();
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });
});

describe("resumeSubscription", () => {
  it("resumes only a cancelled subscription with a key and time left", async () => {
    const now = new Date("2026-11-20T00:00:00Z");
    mockPrisma.subscription.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.subscription.findUnique.mockResolvedValue({
      status: "ACTIVE",
    } as never);

    await resumeSubscription("user-1", now);

    expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        status: { in: ["CANCELED"] },
        billingKey: { not: null },
        currentPeriodEnd: { gt: now },
      },
      data: { status: "ACTIVE", nextRetryAt: null },
    });
    expect(isProWrites()).toEqual([
      { where: { id: "user-1" }, data: { isPro: true } },
    ]);
  });
});

describe("handleBillingDeleted", () => {
  it("finds the subscription by key hash, clears the key and cancels it", async () => {
    mockPrisma.subscription.findUnique.mockResolvedValue({
      id: "sub-1",
      userId: "user-1",
      status: "ACTIVE",
    } as never);

    await expect(handleBillingDeleted("plain-key")).resolves.toBe(true);

    expect(mockPrisma.subscription.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { billingKeyHash: "hash(plain-key)" } }),
    );
    expect(mockPrisma.subscription.update.mock.calls[0][0]).toMatchObject({
      where: { id: "sub-1" },
      data: { status: "CANCELED", billingKey: null, billingKeyHash: null },
    });
    expect(isProWrites()).toEqual([
      { where: { id: "user-1" }, data: { isPro: true } },
    ]);
  });

  it("leaves an expired subscription expired", async () => {
    mockPrisma.subscription.findUnique.mockResolvedValue({
      id: "sub-1",
      userId: "user-1",
      status: "EXPIRED",
    } as never);

    await handleBillingDeleted("plain-key");

    expect(mockPrisma.subscription.update.mock.calls[0][0].data.status).toBe(
      "EXPIRED",
    );
    expect(isProWrites()).toEqual([
      { where: { id: "user-1" }, data: { isPro: false } },
    ]);
  });

  it("returns false for an unknown key", async () => {
    mockPrisma.subscription.findUnique.mockResolvedValue(null);

    await expect(handleBillingDeleted("unknown")).resolves.toBe(false);
    expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
  });
});
