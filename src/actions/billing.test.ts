import { refresh } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  cancelSubscription,
  getCustomerKey,
  resumeSubscription,
} from "@/actions/billing";
import { auth } from "@/auth";
import {
  cancelSubscription as cancelSubscriptionQuery,
  getOrCreateCustomerKey,
  resumeSubscription as resumeSubscriptionQuery,
} from "@/lib/db/billing";

vi.mock("next/cache", () => ({ refresh: vi.fn() }));
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db/billing", () => ({
  cancelSubscription: vi.fn(),
  getOrCreateCustomerKey: vi.fn(),
  resumeSubscription: vi.fn(),
}));

// auth() is overloaded (session getter and middleware wrapper), so cast the mock
const mockAuth = vi.mocked(auth as () => Promise<unknown>);
const mockCancel = vi.mocked(cancelSubscriptionQuery);
const mockResume = vi.mocked(resumeSubscriptionQuery);
const mockGetCustomerKey = vi.mocked(getOrCreateCustomerKey);
const mockRefresh = vi.mocked(refresh);

const OVERVIEW = {
  plan: "MONTHLY" as const,
  status: "CANCELED" as const,
  cardCompany: "현대",
  cardNumber: "4330****1234",
  amount: 11000,
  currentPeriodEnd: new Date("2026-12-10T00:00:00Z"),
};

beforeEach(() => {
  mockAuth.mockResolvedValue({ user: { id: "user-1" } });
});

describe.each([
  ["getCustomerKey", getCustomerKey],
  ["cancelSubscription", cancelSubscription],
  ["resumeSubscription", resumeSubscription],
])("%s", (_name, action) => {
  it("requires a session", async () => {
    mockAuth.mockResolvedValue(null);

    expect(await action()).toEqual({ success: false, error: "You must be signed in" });
    expect(mockGetCustomerKey).not.toHaveBeenCalled();
    expect(mockCancel).not.toHaveBeenCalled();
    expect(mockResume).not.toHaveBeenCalled();
  });
});

describe("getCustomerKey", () => {
  it("returns the session user's customer key", async () => {
    mockGetCustomerKey.mockResolvedValue("dl_customer");

    expect(await getCustomerKey()).toEqual({ success: true, data: "dl_customer" });
    expect(mockGetCustomerKey).toHaveBeenCalledWith("user-1");
  });

  it("returns a friendly error when the query fails", async () => {
    mockGetCustomerKey.mockRejectedValue(new Error("DB down"));

    expect(await getCustomerKey()).toEqual({
      success: false,
      error: "Couldn't start checkout. Please try again.",
    });
  });
});

describe("cancelSubscription", () => {
  it("cancels the session user's subscription and refreshes", async () => {
    mockCancel.mockResolvedValue(OVERVIEW);

    expect(await cancelSubscription()).toEqual({ success: true, data: OVERVIEW });
    expect(mockCancel).toHaveBeenCalledWith("user-1");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("reports when there's no active subscription", async () => {
    mockCancel.mockResolvedValue(null);

    expect(await cancelSubscription()).toEqual({
      success: false,
      error: "No active subscription",
    });
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("returns a friendly error when the query fails", async () => {
    mockCancel.mockRejectedValue(new Error("DB down"));

    const result = await cancelSubscription();

    expect(result).toEqual({
      success: false,
      error: "Couldn't cancel your subscription. Please try again.",
    });
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});

describe("resumeSubscription", () => {
  it("resumes the session user's subscription with the current time", async () => {
    vi.useFakeTimers({ now: new Date("2026-11-10T00:00:00Z") });
    mockResume.mockResolvedValue({ ...OVERVIEW, status: "ACTIVE" });

    const result = await resumeSubscription();

    expect(result).toEqual({ success: true, data: { ...OVERVIEW, status: "ACTIVE" } });
    expect(mockResume).toHaveBeenCalledWith("user-1", new Date("2026-11-10T00:00:00Z"));
    expect(mockRefresh).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("refuses once the period has ended or there's nothing to resume", async () => {
    mockResume.mockResolvedValue(null);

    const result = await resumeSubscription();

    expect(result).toEqual({
      success: false,
      error: "This subscription can't be resumed. Upgrade again to restart Pro.",
    });
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("returns a friendly error when the query fails", async () => {
    mockResume.mockRejectedValue(new Error("DB down"));

    expect(await resumeSubscription()).toEqual({
      success: false,
      error: "Couldn't resume your subscription. Please try again.",
    });
  });
});
