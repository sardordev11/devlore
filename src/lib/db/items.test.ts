import { describe, expect, it, vi } from "vitest";

import { getItemDetail } from "@/lib/db/items";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: { item: { findFirst: vi.fn() } },
}));

const mockPrisma = vi.mocked(prisma, { deep: true });

const createdAt = new Date("2026-01-15T00:00:00Z");

const ROW = {
  id: "item-1",
  title: "useAuth Hook",
  description: "Custom authentication hook",
  contentType: "TEXT",
  content: "export function useAuth() {}",
  language: "typescript",
  url: null,
  fileUrl: null,
  fileName: null,
  isFavorite: true,
  isPinned: false,
  createdAt,
  updatedAt: createdAt,
  type: {
    id: "type-1",
    name: "snippet",
    slug: "snippets",
    icon: "Code",
    color: "#3b82f6",
  },
  tags: [{ name: "auth" }, { name: "react" }],
  collections: [{ collection: { id: "col-1", name: "React Patterns" } }],
};

describe("getItemDetail", () => {
  it("scopes the lookup to the signed-in user", async () => {
    mockPrisma.item.findFirst.mockResolvedValue(null as never);

    await getItemDetail("user-1", "item-1");

    expect(mockPrisma.item.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "item-1", userId: "user-1" } }),
    );
  });

  it("returns null when the item isn't found for the user", async () => {
    mockPrisma.item.findFirst.mockResolvedValue(null as never);

    await expect(getItemDetail("user-2", "item-1")).resolves.toBeNull();
  });

  it("flattens tags and collections", async () => {
    mockPrisma.item.findFirst.mockResolvedValue(ROW as never);

    const item = await getItemDetail("user-1", "item-1");

    expect(item).toEqual({
      ...ROW,
      tags: ["auth", "react"],
      collections: [{ id: "col-1", name: "React Patterns" }],
    });
  });
});
