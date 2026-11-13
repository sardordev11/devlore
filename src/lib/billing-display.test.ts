import { describe, expect, it } from "vitest";

import {
  formatCardNumber,
  formatKrw,
  getCardCompanyName,
  getBillingMessage,
  getBillingView,
  isCardWindowClosed,
  toBillingPlan,
} from "@/lib/billing-display";

describe("toBillingPlan", () => {
  it("maps the billing period to the plan", () => {
    expect(toBillingPlan("monthly")).toBe("MONTHLY");
    expect(toBillingPlan("yearly")).toBe("YEARLY");
  });
});

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

describe("getCardCompanyName", () => {
  it("maps Toss issuer codes to names", () => {
    expect(getCardCompanyName("24")).toBe("Toss Bank");
    expect(getCardCompanyName("4V")).toBe("Visa");
    expect(getCardCompanyName("W1")).toBe("Woori");
  });

  it("passes unknown codes through", () => {
    expect(getCardCompanyName("ZZ")).toBe("ZZ");
    expect(getCardCompanyName("Shinhan")).toBe("Shinhan");
  });
});

describe("formatCardNumber", () => {
  it("groups the masked number in fours", () => {
    expect(formatCardNumber("53275011****697*")).toBe("5327 5011 **** 697*");
  });

  it("normalizes existing spaces and dashes", () => {
    expect(formatCardNumber("4330-12** **** 1234")).toBe("4330 12** **** 1234");
  });

  it("keeps a short remainder group", () => {
    expect(formatCardNumber("1234567")).toBe("1234 567");
  });
});
