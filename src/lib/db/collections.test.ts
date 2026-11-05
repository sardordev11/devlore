import { describe, expect, it, vi } from "vitest";

import {
  createCollection,
  getCollectionOptions,
  ownsCollections,
} from "@/lib/db/collections";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    collection: { create: vi.fn(), findMany: vi.fn(), count: vi.fn() },
  },
}));

const mockPrisma = vi.mocked(prisma, { deep: true });

describe("createCollection", () => {
  it("creates the collection for the given user", async () => {
    const created = { id: "col-1", name: "React Patterns", description: null };
    mockPrisma.collection.create.mockResolvedValue(created as never);

    const result = await createCollection("user-1", {
      name: "React Patterns",
      description: null,
    });

    expect(result).toEqual(created);
    expect(mockPrisma.collection.create).toHaveBeenCalledWith({
      data: { userId: "user-1", name: "React Patterns", description: null },
      select: { id: true, name: true, description: true },
    });
  });
});

describe("getCollectionOptions", () => {
  it("lists only the user's collections by name", async () => {
    const options = [{ id: "col-1", name: "React Patterns" }];
    mockPrisma.collection.findMany.mockResolvedValue(options as never);

    await expect(getCollectionOptions("user-1")).resolves.toEqual(options);
    expect(mockPrisma.collection.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  });
});

describe("ownsCollections", () => {
  it("is true for an empty list without querying", async () => {
    await expect(ownsCollections("user-1", [])).resolves.toBe(true);
    expect(mockPrisma.collection.count).not.toHaveBeenCalled();
  });

  it("counts the ids among the user's collections", async () => {
    mockPrisma.collection.count.mockResolvedValue(2 as never);

    await expect(ownsCollections("user-1", ["col-1", "col-2"])).resolves.toBe(true);
    expect(mockPrisma.collection.count).toHaveBeenCalledWith({
      where: { userId: "user-1", id: { in: ["col-1", "col-2"] } },
    });
  });

  it("is false when any id isn't one of the user's collections", async () => {
    mockPrisma.collection.count.mockResolvedValue(1 as never);

    await expect(ownsCollections("user-1", ["col-1", "col-other"])).resolves.toBe(false);
  });
});
