import { describe, expect, it } from "vitest";

import {
  getPlanHref,
  getProPrice,
  PLAN_PRICES,
  YEARLY_SAVINGS_PERCENT,
} from "./homepage";

describe("getProPrice", () => {
  it("shows the monthly price", () => {
    expect(getProPrice("monthly")).toEqual({
      amount: "$8",
      period: "/month",
      note: "Billed monthly",
    });
  });

  it("shows the yearly price with the monthly equivalent", () => {
    expect(getProPrice("yearly")).toEqual({
      amount: "$72",
      period: "/year",
      note: "$6/month, billed yearly",
    });
  });
});

describe("YEARLY_SAVINGS_PERCENT", () => {
  it("is the yearly discount over twelve monthly payments", () => {
    expect(PLAN_PRICES).toEqual({ monthly: 8, yearly: 72 });
    expect(YEARLY_SAVINGS_PERCENT).toBe(25);
  });
});

describe("getPlanHref", () => {
  it("sends signed-out visitors to sign up for either plan", () => {
    expect(getPlanHref(false, "free")).toBe("/sign-up");
    expect(getPlanHref(false, "pro")).toBe("/sign-up");
  });

  it("sends signed-in users to the dashboard for Free", () => {
    expect(getPlanHref(true, "free")).toBe("/dashboard");
  });

  it("sends signed-in users to billing for Pro", () => {
    expect(getPlanHref(true, "pro")).toBe("/settings/billing");
  });
});
