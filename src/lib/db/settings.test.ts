import { describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import {
  getAccountSettings,
  getEditorPreferences,
  updateEditorPreferences,
} from "@/lib/db/settings";
import { DEFAULT_EDITOR_PREFERENCES } from "@/lib/editor-preferences";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const mockPrisma = vi.mocked(prisma, { deep: true });

describe("getAccountSettings", () => {
  it("looks up only the signed-in user's password hash", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ passwordHash: "hash" } as never);

    await getAccountSettings("user-1");

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { passwordHash: true },
    });
  });

  it("reports a password for users with a password hash", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ passwordHash: "hash" } as never);

    await expect(getAccountSettings("user-1")).resolves.toEqual({
      hasPassword: true,
    });
  });

  it("reports no password for OAuth-only users", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ passwordHash: null } as never);

    await expect(getAccountSettings("user-1")).resolves.toEqual({
      hasPassword: false,
    });
  });

  it("returns null when the user doesn't exist", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(getAccountSettings("missing")).resolves.toBeNull();
  });
});

const preferences = {
  fontSize: 16,
  tabSize: 4,
  wordWrap: false,
  minimap: true,
  theme: "github-dark",
} as const;

describe("getEditorPreferences", () => {
  it("looks up only the signed-in user's editor preferences", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ editorPreferences: null } as never);

    await getEditorPreferences("user-1");

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { editorPreferences: true },
    });
  });

  it("returns the stored preferences", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      editorPreferences: preferences,
    } as never);

    await expect(getEditorPreferences("user-1")).resolves.toEqual(preferences);
  });

  it("returns the defaults when nothing is stored", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ editorPreferences: null } as never);

    await expect(getEditorPreferences("user-1")).resolves.toEqual(
      DEFAULT_EDITOR_PREFERENCES,
    );
  });

  it("returns the defaults when the user doesn't exist", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(getEditorPreferences("missing")).resolves.toEqual(
      DEFAULT_EDITOR_PREFERENCES,
    );
  });
});

describe("updateEditorPreferences", () => {
  it("saves the preferences on the user's own row", async () => {
    mockPrisma.user.update.mockResolvedValue({ editorPreferences: preferences } as never);

    await expect(updateEditorPreferences("user-1", preferences)).resolves.toEqual(
      preferences,
    );
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { editorPreferences: preferences },
      select: { editorPreferences: true },
    });
  });

  it("returns null when the user doesn't exist", async () => {
    mockPrisma.user.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "test",
      }),
    );

    await expect(updateEditorPreferences("missing", preferences)).resolves.toBeNull();
  });

  it("rethrows other errors", async () => {
    mockPrisma.user.update.mockRejectedValue(new Error("connection lost"));

    await expect(updateEditorPreferences("user-1", preferences)).rejects.toThrow(
      "connection lost",
    );
  });
});
