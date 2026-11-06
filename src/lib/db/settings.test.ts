import { describe, expect, it, vi } from "vitest";

import { getAccountSettings } from "@/lib/db/settings";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
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
