import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { auth } from "@/auth";
import { getSessionUserId, toValidationFailure } from "@/lib/action-helpers";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

const mockAuth = vi.mocked(auth as () => Promise<unknown>);

describe("getSessionUserId", () => {
  beforeEach(() => {
    mockAuth.mockReset();
  });

  it("returns the signed-in user's id", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    await expect(getSessionUserId()).resolves.toBe("user-1");
  });

  it("returns null without a session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getSessionUserId()).resolves.toBeNull();
  });

  it("returns null when the session has no user id", async () => {
    mockAuth.mockResolvedValue({ user: { email: "a@example.com" } });
    await expect(getSessionUserId()).resolves.toBeNull();
  });
});

describe("toValidationFailure", () => {
  const schema = z.object({
    title: z.string().min(1, "Title is required"),
    url: z.url("Enter a valid URL"),
  });

  it("returns the first message and per-field messages", () => {
    const parsed = schema.safeParse({ title: "", url: "nope" });
    if (parsed.success) throw new Error("expected a validation failure");

    expect(toValidationFailure(parsed.error, "Invalid item")).toEqual({
      success: false,
      error: "Title is required",
      fieldErrors: {
        title: ["Title is required"],
        url: ["Enter a valid URL"],
      },
    });
  });

  it("falls back when there are no issues", () => {
    const error = new z.ZodError([]);
    expect(toValidationFailure(error, "Invalid item")).toEqual({
      success: false,
      error: "Invalid item",
      fieldErrors: {},
    });
  });
});
