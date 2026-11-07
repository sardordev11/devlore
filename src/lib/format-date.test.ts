import { describe, expect, it } from "vitest";

import { formatDate, formatLocalDate, formatRelativeDate } from "@/lib/format-date";

describe("formatRelativeDate", () => {
  // Local-time constructors keep these stable in any time zone.
  const now = new Date(2026, 10, 7, 18, 0);
  const daysAgo = (days: number, hour = 12) => new Date(2026, 10, 7 - days, hour);

  it("shows the time for today", () => {
    expect(formatRelativeDate(new Date(2026, 10, 7, 15, 42), now)).toBe("Today, 3:42 PM");
    expect(formatRelativeDate(new Date(2026, 10, 7, 0, 5), now)).toBe("Today, 12:05 AM");
  });

  it("treats future dates as today", () => {
    expect(formatRelativeDate(new Date(2026, 10, 7, 19, 0), now)).toBe("Today, 7:00 PM");
  });

  it("uses calendar days, not 24-hour spans", () => {
    expect(formatRelativeDate(new Date(2026, 10, 6, 23, 59), now)).toBe("Yesterday");
  });

  it("shows days within the last week", () => {
    expect(formatRelativeDate(daysAgo(2), now)).toBe("2 days ago");
    expect(formatRelativeDate(daysAgo(4), now)).toBe("4 days ago");
    expect(formatRelativeDate(daysAgo(6), now)).toBe("6 days ago");
  });

  it("shows last week, then weeks", () => {
    expect(formatRelativeDate(daysAgo(7), now)).toBe("Last week");
    expect(formatRelativeDate(daysAgo(13), now)).toBe("Last week");
    expect(formatRelativeDate(daysAgo(14), now)).toBe("2 weeks ago");
    expect(formatRelativeDate(daysAgo(29), now)).toBe("4 weeks ago");
  });

  it("shows months, then years", () => {
    expect(formatRelativeDate(daysAgo(30), now)).toBe("1 month ago");
    expect(formatRelativeDate(daysAgo(150), now)).toBe("5 months ago");
    expect(formatRelativeDate(daysAgo(364), now)).toBe("11 months ago");
    expect(formatRelativeDate(daysAgo(365), now)).toBe("1 year ago");
    expect(formatRelativeDate(daysAgo(800), now)).toBe("2 years ago");
  });

  it("accepts ISO strings and timestamps", () => {
    expect(formatRelativeDate(daysAgo(1).toISOString(), now.getTime())).toBe("Yesterday");
  });
});

describe("formatDate", () => {
  // Late on Jan 15 in UTC, already Jan 16 in many time zones east of it.
  const date = new Date("2026-01-15T23:30:00Z");

  it("formats each style in UTC", () => {
    expect(formatDate(date, "short")).toBe("Jan 15");
    expect(formatDate(date, "medium")).toBe("Jan 15, 2026");
    expect(formatDate(date, "long")).toBe("January 15, 2026");
  });

  it("defaults to the medium style", () => {
    expect(formatDate(date)).toBe("Jan 15, 2026");
  });

  it("accepts ISO strings", () => {
    expect(formatDate("2026-01-15T23:30:00Z", "long")).toBe("January 15, 2026");
  });
});

describe("formatLocalDate", () => {
  it("formats in the local time zone", () => {
    // Noon local time is the same calendar day in every time zone.
    const date = new Date(2026, 0, 15, 12);
    expect(formatLocalDate(date, "long")).toBe("January 15, 2026");
  });
});
