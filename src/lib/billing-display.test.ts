import { describe, expect, it } from "vitest";

import {
  formatKrw,
  getBillingMessage,
  getBillingView,
  isCardWindowClosed,
} from "@/lib/billing-display";

const now = new Date("2026-11-10T00:00:00Z");
const later = new Date("2026-12-10T00:00:00Z");
const earlier = new Date("2026-11-01T00:00:00Z");

describe("getBillingView", () => {
  it("is free without a subscription", () => {
    expect(getBillingView(null, now)).toBe("free");
  });

  it.each([
    ["ACTIVE", later, "active"],
    ["PAST_DUE", later, "past_due"],
    ["CANCELED", later, "canceled"],
    ["CANCELED", earlier, "free"],
    ["CANCELED", now, "free"],
    ["EXPIRED", later, "free"],
  ] as const)("%s ending %s → %s", (status, currentPeriodEnd, view) => {
    expect(getBillingView({ status, currentPeriodEnd }, now)).toBe(view);
  });
});

describe("formatKrw", () => {
  it("formats won without decimals", () => {
    expect(formatKrw(11000)).toBe("₩11,000");
    expect(formatKrw(99000)).toBe("₩99,000");
  });
});

describe("isCardWindowClosed", () => {
  it("recognises Toss's cancel codes", () => {
    expect(isCardWindowClosed("PAY_PROCESS_CANCELED")).toBe(true);
    expect(isCardWindowClosed("USER_CANCEL")).toBe(true);
    expect(isCardWindowClosed("REJECT_CARD_COMPANY")).toBe(false);
  });
});

describe("getBillingMessage", () => {
  it("shows a closed card window as neutral", () => {
    expect(getBillingMessage("PAY_PROCESS_CANCELED")).toEqual({
      tone: "neutral",
      text: "Card registration cancelled.",
    });
  });

  it("maps known codes to friendly errors", () => {
    expect(getBillingMessage("already_subscribed")).toEqual({
      tone: "error",
      text: "You already have Pro, so nothing was charged.",
    });
    expect(getBillingMessage("REJECT_CARD_COMPANY").tone).toBe("error");
  });

  it("falls back to a generic error for unknown codes", () => {
    expect(getBillingMessage("SOMETHING_NEW")).toEqual({
      tone: "error",
      text: "Something went wrong with the payment. Please try again.",
    });
  });

  it("doesn't treat Object.prototype keys as known codes", () => {
    expect(getBillingMessage("toString").text).toBe(
      "Something went wrong with the payment. Please try again.",
    );
  });
});
