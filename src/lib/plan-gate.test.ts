import { afterEach, describe, expect, it, vi } from "vitest";

import type { UserPlan } from "@/types/billing";

vi.mock("@/lib/db/billing", () => ({ getUserPlan: vi.fn() }));

// ENFORCE_PLAN_LIMITS is read at import time, so each case re-imports the
// modules (including the mocked getUserPlan, which is a fresh mock each time)
async function loadWithFlag(enforce: boolean, plan: UserPlan | null) {
  vi.resetModules();
  vi.stubEnv("ENFORCE_PLAN_LIMITS", enforce ? "true" : "");
  const { getUserPlan } = await import("@/lib/db/billing");
  vi.mocked(getUserPlan).mockResolvedValue(plan);
  return { gate: await import("@/lib/plan-gate"), getUserPlan: vi.mocked(getUserPlan) };
}

function plan(overrides: Partial<UserPlan> = {}): UserPlan {
  return { isPro: false, itemCount: 0, collectionCount: 0, ...overrides };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("with limits off", () => {
  it("allows everything without reading the plan", async () => {
    const { gate, getUserPlan } = await loadWithFlag(
      false,
      plan({ itemCount: 500, collectionCount: 30 }),
    );

    expect(await gate.checkItemLimit("user-1", "files")).toBeNull();
    expect(await gate.checkItemLimit("user-1", "snippets")).toBeNull();
    expect(await gate.checkCollectionLimit("user-1")).toBeNull();
    expect(await gate.checkUploadAccess("user-1")).toBeNull();
    expect(await gate.checkAiAccess("user-1")).toBeNull();
    expect(await gate.canViewTypeSlug("user-1", "images")).toBe(true);
    expect(getUserPlan).not.toHaveBeenCalled();
  });
});

describe("canViewTypeSlug with limits on", () => {
  it("blocks Files and Images for free users", async () => {
    const { gate } = await loadWithFlag(true, plan());

    expect(await gate.canViewTypeSlug("user-1", "files")).toBe(false);
    expect(await gate.canViewTypeSlug("user-1", "images")).toBe(false);
  });

  it("allows other types without reading the plan", async () => {
    const { gate, getUserPlan } = await loadWithFlag(true, plan());

    expect(await gate.canViewTypeSlug("user-1", "snippets")).toBe(true);
    expect(await gate.canViewTypeSlug("user-1", "unknown")).toBe(true);
    expect(getUserPlan).not.toHaveBeenCalled();
  });

  it("allows Files and Images for Pro users", async () => {
    const { gate } = await loadWithFlag(true, plan({ isPro: true }));

    expect(await gate.canViewTypeSlug("user-1", "files")).toBe(true);
    expect(await gate.canViewTypeSlug("user-1", "images")).toBe(true);
  });

  it("treats a missing user as free", async () => {
    const { gate } = await loadWithFlag(true, null);

    expect(await gate.canViewTypeSlug("user-1", "images")).toBe(false);
  });
});

describe("with limits on", () => {
  it("rejects File and Image for free users before counting", async () => {
    const { gate, getUserPlan } = await loadWithFlag(true, plan());
    const { UPGRADE_MESSAGES } = await import("@/lib/usage-limits");

    expect(await gate.checkItemLimit("user-1", "files")).toBe(UPGRADE_MESSAGES.fileTypes);
    expect(await gate.checkItemLimit("user-1", "images")).toBe(UPGRADE_MESSAGES.fileTypes);
    expect(getUserPlan).toHaveBeenCalledWith("user-1");
  });

  it("allows the 50th item and rejects the 51st", async () => {
    const { UPGRADE_MESSAGES } = await import("@/lib/usage-limits");
    let { gate } = await loadWithFlag(true, plan({ itemCount: 49 }));
    expect(await gate.checkItemLimit("user-1", "snippets")).toBeNull();

    ({ gate } = await loadWithFlag(true, plan({ itemCount: 50 })));
    expect(await gate.checkItemLimit("user-1", "snippets")).toBe(UPGRADE_MESSAGES.items);
  });

  it("allows the 3rd collection and rejects the 4th", async () => {
    const { UPGRADE_MESSAGES } = await import("@/lib/usage-limits");
    let { gate } = await loadWithFlag(true, plan({ collectionCount: 2 }));
    expect(await gate.checkCollectionLimit("user-1")).toBeNull();

    ({ gate } = await loadWithFlag(true, plan({ collectionCount: 3 })));
    expect(await gate.checkCollectionLimit("user-1")).toBe(UPGRADE_MESSAGES.collections);
  });

  it("rejects uploads for free users only", async () => {
    let { gate } = await loadWithFlag(true, plan());
    expect(await gate.checkUploadAccess("user-1")).not.toBeNull();

    ({ gate } = await loadWithFlag(true, plan({ isPro: true })));
    expect(await gate.checkUploadAccess("user-1")).toBeNull();
  });

  it("allows AI features for Pro users only", async () => {
    let { gate } = await loadWithFlag(true, plan());
    expect(await gate.checkAiAccess("user-1")).toBe(
      "AI features are part of Pro. Upgrade to Pro to use them.",
    );

    ({ gate } = await loadWithFlag(true, plan({ isPro: true })));
    expect(await gate.checkAiAccess("user-1")).toBeNull();
  });

  it("leaves Pro users unrestricted", async () => {
    const { gate } = await loadWithFlag(
      true,
      plan({ isPro: true, itemCount: 500, collectionCount: 30 }),
    );

    expect(await gate.checkItemLimit("user-1", "images")).toBeNull();
    expect(await gate.checkItemLimit("user-1", "snippets")).toBeNull();
    expect(await gate.checkCollectionLimit("user-1")).toBeNull();
  });

  it("treats a missing user as free", async () => {
    const { gate } = await loadWithFlag(true, null);

    expect(await gate.checkUploadAccess("user-1")).not.toBeNull();
    expect(await gate.checkCollectionLimit("user-1")).toBeNull();
  });
});
