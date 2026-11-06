import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { updateEditorPreferences as updateEditorPreferencesQuery } from "@/lib/db/settings";
import { updateEditorPreferences } from "@/actions/settings";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db/settings", () => ({ updateEditorPreferences: vi.fn() }));

// auth() is overloaded (session getter and middleware wrapper), so cast the mock
const mockAuth = vi.mocked(auth as () => Promise<unknown>);
const mockUpdateQuery = vi.mocked(updateEditorPreferencesQuery);

const preferences = {
  fontSize: 14,
  tabSize: 4,
  wordWrap: true,
  minimap: true,
  theme: "monokai",
} as const;

describe("updateEditorPreferences", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" }, expires: "" });
  });

  it("requires a session", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(updateEditorPreferences(preferences)).resolves.toEqual({
      success: false,
      error: "You must be signed in",
    });
    expect(mockUpdateQuery).not.toHaveBeenCalled();
  });

  it.each([
    ["an unlisted font size", { ...preferences, fontSize: 11 }],
    ["an unknown theme", { ...preferences, theme: "light" }],
    ["a partial object", { theme: "monokai" }],
    ["a non-object", "vs-dark"],
  ])("rejects %s", async (_, input) => {
    await expect(updateEditorPreferences(input)).resolves.toEqual({
      success: false,
      error: "Invalid editor preferences",
    });
    expect(mockUpdateQuery).not.toHaveBeenCalled();
  });

  it("saves the preferences for the session user only", async () => {
    mockUpdateQuery.mockResolvedValue(preferences);

    await expect(
      updateEditorPreferences({ ...preferences, userId: "someone-else" }),
    ).resolves.toEqual({ success: true, data: preferences });
    expect(mockUpdateQuery).toHaveBeenCalledWith("user-1", preferences);
  });

  it("reports a missing user", async () => {
    mockUpdateQuery.mockResolvedValue(null);

    await expect(updateEditorPreferences(preferences)).resolves.toEqual({
      success: false,
      error: "User not found",
    });
  });

  it("returns a friendly error when the save fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockUpdateQuery.mockRejectedValue(new Error("connection lost"));

    await expect(updateEditorPreferences(preferences)).resolves.toEqual({
      success: false,
      error: "Couldn't save your editor preferences. Please try again.",
    });
  });
});
