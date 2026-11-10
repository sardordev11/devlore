import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  confirmCardChange,
  confirmUpgrade,
  hasPaidAccess,
  type ConfirmUpgradeInput,
} from "@/lib/billing-confirm";
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
} from "@/lib/toss";

vi.mock("@/lib/db/billing", () => ({
  activateSubscription: vi.fn(),
  getSubscriptionState: vi.fn(),
  replaceBillingKey: vi.fn(),
}));
vi.mock("@/lib/toss", async (importOriginal) => ({
  TossError: (await importOriginal<typeof import("@/lib/toss")>()).TossError,
  issueBillingKey: vi.fn(),
  chargeBillingKey: vi.fn(),
  deleteBillingKey: vi.fn(),
}));
vi.mock("@/lib/billing-key-crypto", () => ({
  decryptBillingKey: (stored: string) => stored.replace(/^enc:/, ""),
}));

const mockGetState = vi.mocked(getSubscriptionState);
const mockActivate = vi.mocked(activateSubscription);
const mockReplace = vi.mocked(replaceBillingKey);
const mockIssue = vi.mocked(issueBillingKey);
const mockCharge = vi.mocked(chargeBillingKey);
const mockDeleteKey = vi.mocked(deleteBillingKey);

const now = new Date("2026-11-10T03:00:00Z");

const upgradeInput: ConfirmUpgradeInput = {
  userId: "user-1",
  email: "dev@example.com",
  plan: "MONTHLY",
  authKey: "auth-1",
  customerKey: "dl_customer",
  now,
};

function state(overrides: Partial<SubscriptionState> = {}): SubscriptionState {
  return {
    status: "ACTIVE",
    billingKey: "enc:old-key",
    currentPeriodEnd: new Date("2026-12-10T00:00:00Z"),
    ...overrides,
  };
}

const BILLING = {
  billingKey: "new-key",
  customerKey: "dl_customer",
  cardCompany: "현대",
  card: { issuerCode: "61", number: "4330****1234", cardType: "신용" },
};

beforeEach(() => {
  mockGetState.mockResolvedValue(null);
  mockIssue.mockResolvedValue(BILLING);
  mockCharge.mockResolvedValue({
    paymentKey: "pay-1",
    orderId: "sub_user-1_20261110",
    status: "DONE",
    totalAmount: 11000,
    approvedAt: now.toISOString(),
  });
  mockDeleteKey.mockResolvedValue({});
});

describe("hasPaidAccess", () => {
  it.each([
    [null, false],
    [state({ status: "ACTIVE" }), true],
    [state({ status: "PAST_DUE" }), true],
    [state({ status: "CANCELED" }), true],
    [state({ status: "CANCELED", currentPeriodEnd: now }), false],
    [state({ status: "EXPIRED" }), false],
  ])("%o → %s", (value, expected) => {
    expect(hasPaidAccess(value, now)).toBe(expected);
  });
});

describe("confirmUpgrade", () => {
  it("issues the key, charges the first period and activates the subscription", async () => {
    const outcome = await confirmUpgrade(upgradeInput);

    expect(outcome).toBe("upgraded=1");
    expect(mockIssue).toHaveBeenCalledWith("auth-1", "dl_customer");
    expect(mockCharge).toHaveBeenCalledWith("new-key", {
      customerKey: "dl_customer",
      amount: 11000,
      orderId: "sub_user-1_20261110",
      orderName: "DevLore Pro (Monthly)",
      customerEmail: "dev@example.com",
    });
    expect(mockActivate).toHaveBeenCalledWith("user-1", {
      plan: "MONTHLY",
      amount: 11000,
      billingKey: "new-key",
      cardCompany: "현대",
      cardNumber: "4330****1234",
      orderId: "sub_user-1_20261110",
      paymentKey: "pay-1",
      periodStart: now,
      periodEnd: new Date("2026-12-10T03:00:00Z"),
    });
    expect(mockDeleteKey).not.toHaveBeenCalled();
  });

  it("charges the yearly amount for 12 months", async () => {
    await confirmUpgrade({ ...upgradeInput, plan: "YEARLY" });

    expect(mockCharge).toHaveBeenCalledWith(
      "new-key",
      expect.objectContaining({ amount: 99000, orderName: "DevLore Pro (Yearly)" }),
    );
    expect(mockActivate).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ periodEnd: new Date("2027-11-10T03:00:00Z") }),
    );
  });

  it("falls back to the issuer code when Toss sends no card company", async () => {
    mockIssue.mockResolvedValue({ ...BILLING, cardCompany: undefined });

    await confirmUpgrade(upgradeInput);

    expect(mockActivate).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ cardCompany: "61" }),
    );
  });

  it.each(["ACTIVE", "PAST_DUE", "CANCELED"] as const)(
    "doesn't charge a user whose %s subscription is still paid",
    async (status) => {
      mockGetState.mockResolvedValue(state({ status }));

      const outcome = await confirmUpgrade(upgradeInput);

      expect(outcome).toBe("error=already_subscribed");
      expect(mockIssue).not.toHaveBeenCalled();
      expect(mockCharge).not.toHaveBeenCalled();
    },
  );

  it("replaces an ended subscription and deletes its old key", async () => {
    mockGetState.mockResolvedValue(
      state({ status: "CANCELED", currentPeriodEnd: new Date("2026-11-01T00:00:00Z") }),
    );

    const outcome = await confirmUpgrade(upgradeInput);

    expect(outcome).toBe("upgraded=1");
    expect(mockDeleteKey).toHaveBeenCalledWith("old-key");
  });

  it("deletes the new key and returns the Toss code when the charge fails", async () => {
    mockCharge.mockRejectedValue(new TossError("REJECT_CARD_COMPANY", "Declined", 400));

    const outcome = await confirmUpgrade(upgradeInput);

    expect(outcome).toBe("error=REJECT_CARD_COMPANY");
    expect(mockDeleteKey).toHaveBeenCalledWith("new-key");
    expect(mockActivate).not.toHaveBeenCalled();
  });

  it("treats a payment that isn't DONE as a failure", async () => {
    mockCharge.mockResolvedValue({
      paymentKey: "pay-1",
      orderId: "x",
      status: "WAITING_FOR_DEPOSIT",
      totalAmount: 11000,
      approvedAt: "",
    });

    const outcome = await confirmUpgrade(upgradeInput);

    expect(outcome).toBe("error=NOT_DONE");
    expect(mockDeleteKey).toHaveBeenCalledWith("new-key");
    expect(mockActivate).not.toHaveBeenCalled();
  });

  it("deletes the new key when saving the subscription fails", async () => {
    mockActivate.mockRejectedValue(new Error("DB down"));

    const outcome = await confirmUpgrade(upgradeInput);

    expect(outcome).toBe("error=server");
    expect(mockDeleteKey).toHaveBeenCalledWith("new-key");
  });

  it("has no key to delete when issuing fails", async () => {
    mockIssue.mockRejectedValue(new TossError("INVALID_AUTH_KEY", "Bad", 400));

    const outcome = await confirmUpgrade(upgradeInput);

    expect(outcome).toBe("error=INVALID_AUTH_KEY");
    expect(mockDeleteKey).not.toHaveBeenCalled();
  });

  it("still redirects with the error when deleting the key fails too", async () => {
    mockCharge.mockRejectedValue(new TossError("REJECT_CARD_COMPANY", "No", 400));
    mockDeleteKey.mockRejectedValue(new Error("Toss down"));

    await expect(confirmUpgrade(upgradeInput)).resolves.toBe(
      "error=REJECT_CARD_COMPANY",
    );
  });
});

describe("confirmCardChange", () => {
  const input = { userId: "user-1", authKey: "auth-1", customerKey: "dl_customer" };

  it("stores the new key, deletes the old one and charges nothing", async () => {
    mockGetState.mockResolvedValue(state());
    mockReplace.mockResolvedValue("enc:old-key");

    const outcome = await confirmCardChange(input);

    expect(outcome).toBe("card_changed=1");
    expect(mockReplace).toHaveBeenCalledWith("user-1", {
      billingKey: "new-key",
      cardCompany: "현대",
      cardNumber: "4330****1234",
    });
    expect(mockDeleteKey).toHaveBeenCalledWith("old-key");
    expect(mockCharge).not.toHaveBeenCalled();
  });

  it("adds a card to a cancelled subscription whose key Toss deleted", async () => {
    mockGetState.mockResolvedValue(state({ status: "CANCELED", billingKey: null }));
    mockReplace.mockResolvedValue(null);

    const outcome = await confirmCardChange(input);

    expect(outcome).toBe("card_changed=1");
    expect(mockDeleteKey).not.toHaveBeenCalled();
  });

  it.each([null, state({ status: "EXPIRED" })])(
    "refuses without a live subscription (%o)",
    async (value) => {
      mockGetState.mockResolvedValue(value);

      const outcome = await confirmCardChange(input);

      expect(outcome).toBe("error=no_subscription");
      expect(mockIssue).not.toHaveBeenCalled();
    },
  );

  it("deletes the new key when the subscription is gone by the time it's saved", async () => {
    mockGetState.mockResolvedValue(state());
    mockReplace.mockResolvedValue(undefined);

    const outcome = await confirmCardChange(input);

    expect(outcome).toBe("error=no_subscription");
    expect(mockDeleteKey).toHaveBeenCalledWith("new-key");
  });

  it("deletes the new key when saving fails", async () => {
    mockGetState.mockResolvedValue(state());
    mockReplace.mockRejectedValue(new Error("DB down"));

    const outcome = await confirmCardChange(input);

    expect(outcome).toBe("error=server");
    expect(mockDeleteKey).toHaveBeenCalledWith("new-key");
  });
});
