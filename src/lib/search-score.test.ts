import { describe, expect, it } from "vitest";

import { scoreSearchMatch } from "@/lib/search-score";

describe("scoreSearchMatch", () => {
  it("matches everything for a blank search", () => {
    expect(scoreSearchMatch("  ", ["Anything"])).toBe(1);
  });

  it("fuzzy matches within a single title word", () => {
    expect(scoreSearchMatch("dckr", ["Remove unused Docker data"])).toBeGreaterThan(0);
    expect(scoreSearchMatch("nxt", ["Next.js docs"])).toBeGreaterThan(0);
    expect(scoreSearchMatch("usdb", ["useDebounce hook"])).toBeGreaterThan(0);
  });

  it("doesn't match letters spread across words or mid-word", () => {
    expect(scoreSearchMatch("test", ["Context provider & compound components"])).toBe(0);
    expect(scoreSearchMatch("test", ["cn, formatDate & sleep utilities"])).toBe(0);
    expect(scoreSearchMatch("crp", ["Code review prompt"])).toBe(0);
  });

  it("ignores case and extra whitespace", () => {
    expect(scoreSearchMatch("  DOCKER   Data ", ["Remove unused Docker data"])).toBe(1);
  });

  it("matches substrings inside words", () => {
    expect(scoreSearchMatch("debounce", ["useDebounce hook"])).toBe(0.8);
  });

  it("matches the type name", () => {
    expect(scoreSearchMatch("snippet", ["useAuth", "snippet"])).toBeGreaterThan(0);
  });

  it("matches previews only as substrings", () => {
    expect(
      scoreSearchMatch("react", ["Hooks", "snippet", 'import { useState } from "react";']),
    ).toBe(0.5);
    expect(
      scoreSearchMatch("rct", ["Hooks", "snippet", 'from "react";']),
    ).toBe(0);
  });

  it("requires every search word to match", () => {
    expect(scoreSearchMatch("docker prune", ["Remove unused Docker data", "command", "docker system prune -a"])).toBeGreaterThan(0);
    expect(scoreSearchMatch("docker react", ["Remove unused Docker data"])).toBe(0);
  });

  it("ranks word-start title matches above fuzzy and preview matches", () => {
    const title = scoreSearchMatch("react", ["React Patterns"]);
    const fuzzy = scoreSearchMatch("react", ["Refactoring assistant"]);
    const preview = scoreSearchMatch("react", ["Hooks", "snippet", "uses react"]);
    expect(title).toBeGreaterThan(fuzzy);
    expect(title).toBeGreaterThan(preview);
  });
});
