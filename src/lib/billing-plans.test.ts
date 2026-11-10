import { describe, expect, it } from "vitest";

import {
  addDays,
  addMonths,
  BILLING_PLANS,
  getOrderId,
  parseBillingPlan,
} from "@/lib/billing-plans";

const utc = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe("BILLING_PLANS", () => {
  it("has a monthly and a yearly plan", () => {
    expect(BILLING_PLANS.MONTHLY.months).toBe(1);
    expect(BILLING_PLANS.YEARLY.months).toBe(12);
  });
});

describe("addMonths", () => {
  it("adds a month on an ordinary day", () => {
    expect(addMonths(utc("2026-03-15"), 1)).toEqual(utc("2026-04-15"));
  });

  it("clamps Jan 31 to Feb 28", () => {
    expect(addMonths(utc("2026-01-31"), 1)).toEqual(utc("2026-02-28"));
  });

  it("clamps Jan 31 to Feb 29 in a leap year", () => {
    expect(addMonths(utc("2028-01-31"), 1)).toEqual(utc("2028-02-29"));
  });

  it("rolls December into January of the next year", () => {
    expect(addMonths(utc("2026-12-10"), 1)).toEqual(utc("2027-01-10"));
  });

  it("adds 12 months", () => {
    expect(addMonths(utc("2026-11-10"), 12)).toEqual(utc("2027-11-10"));
  });

  it("keeps the time of day", () => {
    const date = new Date("2026-05-31T23:45:10.000Z");
    expect(addMonths(date, 1)).toEqual(new Date("2026-06-30T23:45:10.000Z"));
  });

  it("doesn't change the input date", () => {
    const date = utc("2026-01-31");
    addMonths(date, 1);
    expect(date).toEqual(utc("2026-01-31"));
  });
});

describe("addDays", () => {
  it("adds whole days", () => {
    expect(addDays(utc("2026-02-27"), 3)).toEqual(utc("2026-03-02"));
  });

  it("subtracts with a negative count", () => {
    expect(addDays(utc("2026-01-01"), -1)).toEqual(utc("2025-12-31"));
  });
});

describe("getOrderId", () => {
  const userId = "cmh1x2y3z0000abcd1234efgh";

  it("uses the user id and the period start day", () => {
    expect(getOrderId(userId, utc("2026-11-10"))).toBe(`sub_${userId}_20261110`);
  });

  it("is deterministic within a day", () => {
    expect(getOrderId(userId, new Date("2026-11-10T01:00:00Z"))).toBe(
      getOrderId(userId, new Date("2026-11-10T22:30:00Z")),
    );
  });

  it("fits Toss's 6–64 [A-Za-z0-9_=-] rule", () => {
    const orderId = getOrderId(userId, utc("2026-11-10"));
    expect(orderId).toMatch(/^[A-Za-z0-9_=-]{6,64}$/);
  });
});

describe("parseBillingPlan", () => {
  it("accepts MONTHLY and YEARLY", () => {
    expect(parseBillingPlan("MONTHLY")).toBe("MONTHLY");
    expect(parseBillingPlan("YEARLY")).toBe("YEARLY");
  });

  it("rejects anything else", () => {
    for (const value of ["monthly", "WEEKLY", "", null, undefined, 1]) {
      expect(parseBillingPlan(value)).toBeNull();
    }
  });
});
