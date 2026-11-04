import { describe, expect, it } from "vitest";

import { formatDate, formatLocalDate } from "@/lib/format-date";

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
