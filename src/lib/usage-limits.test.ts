import { afterEach, describe, expect, it, vi } from "vitest";

import type { UserPlan } from "@/types/billing";

// ENFORCE_PLAN_LIMITS is read at import time, so each case re-imports the module
async function loadWithFlag(value: string | undefined) {
  vi.resetModules();
  if (value === undefined) {
    vi.stubEnv("ENFORCE_PLAN_LIMITS", undefined);
  } else {
    vi.stubEnv("ENFORCE_PLAN_LIMITS", value);
  }
  return import("@/lib/usage-limits");
}

function plan(overrides: Partial<UserPlan> = {}): UserPlan {
  return { isPro: false, itemCount: 0, collectionCount: 0, ...overrides };
}

const TEXT_SLUGS = ["snippets", "prompts", "commands", "notes", "links"];

afterEach(() => {
  vi.unstubAllEnvs();
});

describe.each([undefined, "", "false", "TRUE"])(
  "with ENFORCE_PLAN_LIMITS=%j (off)",
  (value) => {
    it("leaves the flag off", async () => {
      const limits = await loadWithFlag(value);
      expect(limits.ENFORCE_PLAN_LIMITS).toBe(false);
    });

    it("lets free users use Pro", async () => {
      const limits = await loadWithFlag(value);
      expect(limits.canUsePro({ isPro: false })).toBe(true);
    });

    it("allows free users past every limit", async () => {
      const limits = await loadWithFlag(value);
      const free = plan({ itemCount: 500, collectionCount: 30 });

      expect(limits.canCreateItem(free)).toBe(true);
      expect(limits.canCreateCollection(free)).toBe(true);
      expect(limits.canUseTypeSlug(free, "files")).toBe(true);
      expect(limits.canUseTypeSlug(free, "images")).toBe(true);
    });
  },
);

describe('with ENFORCE_PLAN_LIMITS="true"', () => {
  it("turns the flag on", async () => {
    const limits = await loadWithFlag("true");
    expect(limits.ENFORCE_PLAN_LIMITS).toBe(true);
  });

  it("follows isPro in canUsePro", async () => {
    const limits = await loadWithFlag("true");
    expect(limits.canUsePro({ isPro: false })).toBe(false);
    expect(limits.canUsePro({ isPro: true })).toBe(true);
  });

  it("allows a free user at 49 items and blocks at 50", async () => {
    const limits = await loadWithFlag("true");
    expect(limits.canCreateItem(plan({ itemCount: 49 }))).toBe(true);
    expect(limits.canCreateItem(plan({ itemCount: 50 }))).toBe(false);
  });

  it("allows a free user at 2 collections and blocks at 3", async () => {
    const limits = await loadWithFlag("true");
    expect(limits.canCreateCollection(plan({ collectionCount: 2 }))).toBe(true);
    expect(limits.canCreateCollection(plan({ collectionCount: 3 }))).toBe(false);
  });

  it("allows a Pro user far past both limits", async () => {
    const limits = await loadWithFlag("true");
    const pro = plan({ isPro: true, itemCount: 10_000, collectionCount: 1_000 });

    expect(limits.canCreateItem(pro)).toBe(true);
    expect(limits.canCreateCollection(pro)).toBe(true);
  });

  it("blocks File and Image for free users only", async () => {
    const limits = await loadWithFlag("true");

    for (const slug of ["files", "images"]) {
      expect(limits.canUseTypeSlug(plan(), slug)).toBe(false);
      expect(limits.canUseTypeSlug(plan({ isPro: true }), slug)).toBe(true);
    }
  });

  it("allows the text and link types for free users", async () => {
    const limits = await loadWithFlag("true");

    for (const slug of TEXT_SLUGS) {
      expect(limits.canUseTypeSlug(plan(), slug)).toBe(true);
    }
  });

  it("checks isWithinLimit at the boundaries", async () => {
    const limits = await loadWithFlag("true");

    expect(limits.isWithinLimit(9, 10, false)).toBe(true);
    expect(limits.isWithinLimit(10, 10, false)).toBe(false);
    expect(limits.isWithinLimit(11, 10, false)).toBe(false);
    expect(limits.isWithinLimit(11, 10, true)).toBe(true);
  });
});

describe("isProOnlyTypeSlug", () => {
  it("is true only for files and images", async () => {
    const limits = await loadWithFlag(undefined);

    expect(limits.isProOnlyTypeSlug("files")).toBe(true);
    expect(limits.isProOnlyTypeSlug("images")).toBe(true);
    for (const slug of TEXT_SLUGS) {
      expect(limits.isProOnlyTypeSlug(slug)).toBe(false);
    }
    expect(limits.isProOnlyTypeSlug("videos")).toBe(false);
  });
});

describe("UPGRADE_MESSAGES", () => {
  it("include the free limits", async () => {
    const limits = await loadWithFlag(undefined);

    expect(limits.UPGRADE_MESSAGES.items).toContain(String(limits.FREE_LIMITS.items));
    expect(limits.UPGRADE_MESSAGES.collections).toContain(
      String(limits.FREE_LIMITS.collections),
    );
    expect(limits.UPGRADE_MESSAGES.fileTypes).toMatch(/Pro/);
  });
});
