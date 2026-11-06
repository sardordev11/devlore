import { describe, expect, it } from "vitest";

import {
  getPageCount,
  getPageHref,
  getPageNumbers,
  getPageOffset,
  MAX_PAGE,
  parsePage,
} from "@/lib/pagination";

describe("parsePage", () => {
  it("reads a positive whole number", () => {
    expect(parsePage("3")).toBe(3);
  });

  it("falls back to 1 for missing or invalid values", () => {
    for (const value of [undefined, "", "0", "-2", "1.5", "abc", "2abc"]) {
      expect(parsePage(value)).toBe(1);
    }
  });

  it("uses the first value of a repeated param", () => {
    expect(parsePage(["4", "9"])).toBe(4);
  });

  it("caps huge values", () => {
    expect(parsePage("99999999999999999999")).toBe(MAX_PAGE);
  });
});

describe("getPageCount", () => {
  it("rounds up and never returns less than 1", () => {
    expect(getPageCount(0, 21)).toBe(1);
    expect(getPageCount(21, 21)).toBe(1);
    expect(getPageCount(22, 21)).toBe(2);
  });
});

describe("getPageOffset", () => {
  it("skips the earlier pages", () => {
    expect(getPageOffset(1, 21)).toBe(0);
    expect(getPageOffset(3, 21)).toBe(42);
  });
});

describe("getPageNumbers", () => {
  it("lists every page when there are few", () => {
    expect(getPageNumbers(1, 1)).toEqual([1]);
    expect(getPageNumbers(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("adds ellipses around the current page", () => {
    expect(getPageNumbers(5, 10)).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 10]);
  });

  it("shows a single skipped page instead of an ellipsis", () => {
    expect(getPageNumbers(1, 10)).toEqual([1, 2, "ellipsis", 10]);
    expect(getPageNumbers(4, 10)).toEqual([1, 2, 3, 4, 5, "ellipsis", 10]);
    expect(getPageNumbers(10, 10)).toEqual([1, "ellipsis", 9, 10]);
  });
});

describe("getPageHref", () => {
  it("uses the bare path for page 1", () => {
    expect(getPageHref("/items/snippets", 1)).toBe("/items/snippets");
  });

  it("adds the page param for later pages", () => {
    expect(getPageHref("/items/snippets", 2)).toBe("/items/snippets?page=2");
  });
});
