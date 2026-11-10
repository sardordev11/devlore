import { beforeEach, describe, expect, it, vi } from "vitest";

import { runBillingCycle } from "@/lib/billing-cycle";
import {
  expireSubscription,
  getDueSubscriptions,
  recordFailedRenewal,
  recordRenewal,
  type DueSubscription,
} from "@/lib/db/billing";
import { chargeBillingKey, deleteBillingKey, TossError } from "@/lib/toss";

vi.mock("@/lib/db/billing", () => ({
  getDueSubscriptions: vi.fn(),
  recordRenewal: vi.fn(),
  recordFailedRenewal: vi.fn(),
  expireSubscription: vi.fn(),
}));
vi.mock("@/lib/toss", async (importOriginal) => ({
  TossError: (await importOriginal<typeof import("@/lib/toss")>()).TossError,
  chargeBillingKey: vi.fn(),
  deleteBillingKey: vi.fn(),
}));
vi.mock("@/lib/billing-key-crypto", () => ({
  decryptBillingKey: (stored: string) => stored.replace(/^enc:/, ""),
}));

const mockGetDue = vi.mocked(getDueSubscriptions);
const mockCharge = vi.mocked(chargeBillingKey);
const mockDeleteKey = vi.mocked(deleteBillingKey);
const mockRecordRenewal = vi.mocked(recordRenewal);
const mockRecordFailed = vi.mocked(recordFailedRenewal);
const mockExpire = vi.mocked(expireSubscription);

const now = new Date("2026-11-10T01:00:00Z");
const periodEnd = new Date("2026-11-09T12:00:00Z");

function subscription(overrides: Partial<DueSubscription> = {}): DueSubscription {
  return {
    id: "sub-1",
    userId: "user-1",
    plan: "MONTHLY",
    status: "ACTIVE",
    billingKey: "enc:bk-1",
    billingKeyHash: "hash",
    cardCompany: "현대",
    cardNumber: "4330****",
    amount: 11000,
    currentPeriodStart: new Date("2026-10-09T12:00:00Z"),
    currentPeriodEnd: periodEnd,
    failedAttempts: 0,
    nextRetryAt: null,
    createdAt: now,
    updatedAt: now,
    user: { email: "dev@example.com", tossCustomerKey: "dl_customer" },
    ...overrides,
  } as DueSubscription;
}

function donePayment() {
  return {
    paymentKey: "pay-1",
    orderId: "sub_user-1_20261109",
    status: "DONE",
    totalAmount: 11000,
    approvedAt: now.toISOString(),
  };
}

beforeEach(() => {
  mockRecordRenewal.mockResolvedValue(undefined);
  mockRecordFailed.mockResolvedValue(undefined);
  mockExpire.mockResolvedValue(null);
  mockDeleteKey.mockResolvedValue({});
});

describe("runBillingCycle", () => {
  it("renews a due ACTIVE subscription and extends the period", async () => {
    mockGetDue.mockResolvedValue([subscription()]);
    mockCharge.mockResolvedValue(donePayment());

    const summary = await runBillingCycle(now);

    expect(summary).toEqual({ renewed: 1, failed: 0, expired: 0 });
    expect(mockGetDue).toHaveBeenCalledWith(now);
    expect(mockCharge).toHaveBeenCalledWith("bk-1", {
      customerKey: "dl_customer",
      amount: 11000,
      orderId: "sub_user-1_20261109",
      orderName: "DevLore Pro (Monthly)",
      customerEmail: "dev@example.com",
    });
    expect(mockRecordRenewal).toHaveBeenCalledWith("sub-1", {
      orderId: "sub_user-1_20261109",
      paymentKey: "pay-1",
      periodStart: periodEnd,
      periodEnd: new Date("2026-12-09T12:00:00Z"),
    });
  });

  it("charges the yearly amount and extends a yearly plan by 12 months", async () => {
    mockGetDue.mockResolvedValue([subscription({ plan: "YEARLY", amount: 99000 })]);
    mockCharge.mockResolvedValue(donePayment());

    await runBillingCycle(now);

    expect(mockCharge).toHaveBeenCalledWith(
      "bk-1",
      expect.objectContaining({ amount: 99000 }),
    );
    expect(mockRecordRenewal).toHaveBeenCalledWith(
      "sub-1",
      expect.objectContaining({ periodEnd: new Date("2027-11-09T12:00:00Z") }),
    );
  });

  it("retries a PAST_DUE subscription and clears it on success", async () => {
    mockGetDue.mockResolvedValue([
      subscription({ status: "PAST_DUE", failedAttempts: 1, nextRetryAt: now }),
    ]);
    mockCharge.mockResolvedValue(donePayment());

    const summary = await runBillingCycle(now);

    expect(summary.renewed).toBe(1);
    // Same period, so the same orderId as the failed attempt
    expect(mockCharge).toHaveBeenCalledWith(
      "bk-1",
      expect.objectContaining({ orderId: "sub_user-1_20261109" }),
    );
  });

  it("moves a failed charge to PAST_DUE with a retry a day later", async () => {
    mockGetDue.mockResolvedValue([subscription()]);
    mockCharge.mockRejectedValue(
      new TossError("REJECT_CARD_COMPANY", "Card declined", 400),
    );

    const summary = await runBillingCycle(now);

    expect(summary).toEqual({ renewed: 0, failed: 1, expired: 0 });
    expect(mockRecordFailed).toHaveBeenCalledWith("sub-1", {
      orderId: "sub_user-1_20261109",
      periodStart: periodEnd,
      periodEnd: new Date("2026-12-09T12:00:00Z"),
      failedAttempts: 1,
      nextRetryAt: new Date("2026-11-11T01:00:00Z"),
      failureCode: "REJECT_CARD_COMPANY",
      failureMessage: "Card declined",
    });
    expect(mockRecordRenewal).not.toHaveBeenCalled();
  });

  it("treats a payment that isn't DONE as a failure", async () => {
    mockGetDue.mockResolvedValue([subscription()]);
    mockCharge.mockResolvedValue({ ...donePayment(), status: "ABORTED" });

    const summary = await runBillingCycle(now);

    expect(summary.failed).toBe(1);
    expect(mockRecordFailed).toHaveBeenCalledWith(
      "sub-1",
      expect.objectContaining({ failureCode: "NOT_DONE" }),
    );
    expect(mockRecordRenewal).not.toHaveBeenCalled();
  });

  it("expires after MAX_FAILED_ATTEMPTS and deletes the billing key", async () => {
    mockGetDue.mockResolvedValue([
      subscription({ status: "PAST_DUE", failedAttempts: 2 }),
    ]);
    mockCharge.mockRejectedValue(new TossError("REJECT_CARD_COMPANY", "No", 400));
    mockExpire.mockResolvedValue("enc:bk-1");

    const summary = await runBillingCycle(now);

    expect(summary).toEqual({ renewed: 0, failed: 0, expired: 1 });
    expect(mockExpire).toHaveBeenCalledWith("sub-1");
    expect(mockRecordFailed).not.toHaveBeenCalled();
    expect(mockDeleteKey).toHaveBeenCalledWith("bk-1");
  });

  it("expires a CANCELED subscription at the period end without charging", async () => {
    mockGetDue.mockResolvedValue([subscription({ status: "CANCELED" })]);
    mockExpire.mockResolvedValue("enc:bk-1");

    const summary = await runBillingCycle(now);

    expect(summary).toEqual({ renewed: 0, failed: 0, expired: 1 });
    expect(mockCharge).not.toHaveBeenCalled();
    expect(mockDeleteKey).toHaveBeenCalledWith("bk-1");
  });

  it("still counts the expiry when deleting the key at Toss fails", async () => {
    mockGetDue.mockResolvedValue([subscription({ status: "CANCELED" })]);
    mockExpire.mockResolvedValue("enc:bk-1");
    mockDeleteKey.mockRejectedValue(new Error("Toss down"));

    const summary = await runBillingCycle(now);

    expect(summary.expired).toBe(1);
  });

  it("doesn't call Toss to delete a key that's already gone", async () => {
    mockGetDue.mockResolvedValue([subscription({ status: "CANCELED", billingKey: null })]);

    await runBillingCycle(now);

    expect(mockDeleteKey).not.toHaveBeenCalled();
  });

  it("counts a missing billing key as a failed charge", async () => {
    mockGetDue.mockResolvedValue([subscription({ billingKey: null })]);

    const summary = await runBillingCycle(now);

    expect(summary.failed).toBe(1);
    expect(mockCharge).not.toHaveBeenCalled();
    expect(mockRecordFailed).toHaveBeenCalledWith(
      "sub-1",
      expect.objectContaining({ failureCode: "NO_BILLING_KEY" }),
    );
  });

  it("doesn't count a database error after a paid charge as a failed payment", async () => {
    mockGetDue.mockResolvedValue([subscription()]);
    mockCharge.mockResolvedValue(donePayment());
    mockRecordRenewal.mockRejectedValue(new Error("DB down"));

    const summary = await runBillingCycle(now);

    expect(summary).toEqual({ renewed: 0, failed: 0, expired: 0 });
    expect(mockRecordFailed).not.toHaveBeenCalled();
    expect(mockExpire).not.toHaveBeenCalled();
  });

  it("keeps going after one subscription throws", async () => {
    mockGetDue.mockResolvedValue([
      subscription({ id: "sub-1", userId: "user-1" }),
      subscription({ id: "sub-2", userId: "user-2" }),
    ]);
    mockCharge.mockResolvedValue(donePayment());
    mockRecordRenewal
      .mockRejectedValueOnce(new Error("DB down"))
      .mockResolvedValueOnce(undefined);

    const summary = await runBillingCycle(now);

    expect(summary.renewed).toBe(1);
    expect(mockRecordRenewal).toHaveBeenLastCalledWith(
      "sub-2",
      expect.objectContaining({ orderId: "sub_user-2_20261109" }),
    );
  });

  it("charges subscriptions one at a time", async () => {
    mockGetDue.mockResolvedValue([
      subscription({ id: "sub-1" }),
      subscription({ id: "sub-2", userId: "user-2" }),
    ]);
    let inFlight = 0;
    let maxInFlight = 0;
    mockCharge.mockImplementation(async () => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await Promise.resolve();
      inFlight--;
      return donePayment();
    });

    await runBillingCycle(now);

    expect(maxInFlight).toBe(1);
  });
});
