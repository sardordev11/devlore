import { describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import {
  createCollection,
  deleteCollection,
  getAllCollections,
  getCollection,
  getCollectionOptions,
  getCollectionsPage,
  getFavoriteCollections,
  ownsCollections,
  setCollectionFavorite,
  updateCollection,
} from "@/lib/db/collections";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    collection: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

const mockPrisma = vi.mocked(prisma, { deep: true });

const notFoundError = () =>
  new Prisma.PrismaClientKnownRequestError("Record not found", {
    code: "P2025",
    clientVersion: "test",
  });

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

const COLLECTION_ROW = {
  id: "col-1",
  name: "React Patterns",
  description: "Hooks and components",
  isFavorite: true,
  defaultType: null,
  _count: { items: 3 },
};

const SNIPPET_TYPE = {
  id: "type-1",
  name: "snippet",
  icon: "Code",
  color: "#3b82f6",
};

describe("getAllCollections", () => {
  it("lists every collection of the user, favorites first, with type counts", async () => {
    mockPrisma.collection.findMany.mockResolvedValue([COLLECTION_ROW] as never);
    mockPrisma.$queryRaw.mockResolvedValue([
      { collectionId: "col-1", ...SNIPPET_TYPE, itemCount: 3 },
    ] as never);

    const result = await getAllCollections("user-1");

    expect(result).toEqual([
      {
        id: "col-1",
        name: "React Patterns",
        description: "Hooks and components",
        isFavorite: true,
        itemCount: 3,
        accentColor: "#3b82f6",
        types: [{ ...SNIPPET_TYPE, itemCount: 3 }],
      },
    ]);
    const [args] = mockPrisma.collection.findMany.mock.calls[0];
    expect(args?.where).toEqual({ userId: "user-1" });
    expect(args?.orderBy).toEqual([
      { isFavorite: "desc" },
      { updatedAt: "desc" },
      { id: "asc" },
    ]);
  });

  it("returns an empty list without the type query", async () => {
    mockPrisma.collection.findMany.mockResolvedValue([] as never);

    await expect(getAllCollections("user-1")).resolves.toEqual([]);
    expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
  });
});

describe("getFavoriteCollections", () => {
  it("lists the user's favorite collections, most recently updated first", async () => {
    const updatedAt = new Date("2026-02-01T00:00:00Z");
    mockPrisma.collection.findMany.mockResolvedValue([
      { ...COLLECTION_ROW, updatedAt },
    ] as never);
    mockPrisma.$queryRaw.mockResolvedValue([
      { collectionId: "col-1", ...SNIPPET_TYPE, itemCount: 3 },
    ] as never);

    const result = await getFavoriteCollections("user-1");

    expect(result).toEqual([
      expect.objectContaining({
        id: "col-1",
        name: "React Patterns",
        itemCount: 3,
        accentColor: "#3b82f6",
        updatedAt,
      }),
    ]);
    const [args] = mockPrisma.collection.findMany.mock.calls[0];
    expect(args?.where).toEqual({ userId: "user-1", isFavorite: true });
    expect(args?.orderBy).toEqual([{ updatedAt: "desc" }, { id: "asc" }]);
  });

  it("returns an empty list without the type query", async () => {
    mockPrisma.collection.findMany.mockResolvedValue([] as never);

    await expect(getFavoriteCollections("user-1")).resolves.toEqual([]);
    expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
  });
});

describe("getCollectionsPage", () => {
  it("fetches only the requested page and the total count", async () => {
    mockPrisma.collection.findMany.mockResolvedValue([COLLECTION_ROW] as never);
    mockPrisma.collection.count.mockResolvedValue(43 as never);
    mockPrisma.$queryRaw.mockResolvedValue([] as never);

    const result = await getCollectionsPage("user-1", 3);

    expect(result.total).toBe(43);
    expect(result.collections).toEqual([
      expect.objectContaining({ id: "col-1", itemCount: 3 }),
    ]);
    const [args] = mockPrisma.collection.findMany.mock.calls[0];
    expect(args?.where).toEqual({ userId: "user-1" });
    expect(args?.skip).toBe(42);
    expect(args?.take).toBe(21);
    expect(mockPrisma.collection.count).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
  });

  it("starts at the first page by default", async () => {
    mockPrisma.collection.findMany.mockResolvedValue([] as never);
    mockPrisma.collection.count.mockResolvedValue(0 as never);

    await expect(getCollectionsPage("user-1")).resolves.toEqual({
      collections: [],
      total: 0,
    });
    const [args] = mockPrisma.collection.findMany.mock.calls[0];
    expect(args?.skip).toBe(0);
  });
});

describe("getCollection", () => {
  it("returns the user's collection as a summary", async () => {
    mockPrisma.collection.findFirst.mockResolvedValue(COLLECTION_ROW as never);
    mockPrisma.$queryRaw.mockResolvedValue([] as never);

    const result = await getCollection("user-1", "col-1");

    expect(result).toEqual(
      expect.objectContaining({ id: "col-1", itemCount: 3, accentColor: null }),
    );
    const [args] = mockPrisma.collection.findFirst.mock.calls[0];
    expect(args?.where).toEqual({ id: "col-1", userId: "user-1" });
  });

  it("falls back to the default type when the collection is empty", async () => {
    mockPrisma.collection.findFirst.mockResolvedValue({
      ...COLLECTION_ROW,
      defaultType: SNIPPET_TYPE,
      _count: { items: 0 },
    } as never);
    mockPrisma.$queryRaw.mockResolvedValue([] as never);

    const result = await getCollection("user-1", "col-1");

    expect(result?.accentColor).toBe("#3b82f6");
    expect(result?.types).toEqual([{ ...SNIPPET_TYPE, itemCount: 0 }]);
  });

  it("returns null for unknown or other users' collections", async () => {
    mockPrisma.collection.findFirst.mockResolvedValue(null);

    await expect(getCollection("user-1", "col-other")).resolves.toBeNull();
    expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
  });
});

describe("updateCollection", () => {
  it("updates the collection scoped to the user", async () => {
    const updated = { id: "col-1", name: "Renamed", description: null };
    mockPrisma.collection.update.mockResolvedValue(updated as never);

    const result = await updateCollection("user-1", "col-1", {
      name: "Renamed",
      description: null,
    });

    expect(result).toEqual(updated);
    expect(mockPrisma.collection.update).toHaveBeenCalledWith({
      where: { id: "col-1", userId: "user-1" },
      data: { name: "Renamed", description: null },
      select: { id: true, name: true, description: true },
    });
  });

  it("returns null for unknown or other users' collections", async () => {
    mockPrisma.collection.update.mockRejectedValue(notFoundError());

    await expect(
      updateCollection("user-1", "col-other", { name: "x", description: null }),
    ).resolves.toBeNull();
  });

  it("rethrows other errors", async () => {
    mockPrisma.collection.update.mockRejectedValue(new Error("db down"));

    await expect(
      updateCollection("user-1", "col-1", { name: "x", description: null }),
    ).rejects.toThrow("db down");
  });
});

describe("deleteCollection", () => {
  it("deletes only the collection, scoped to the user", async () => {
    mockPrisma.collection.delete.mockResolvedValue({ id: "col-1" } as never);

    await expect(deleteCollection("user-1", "col-1")).resolves.toEqual({
      id: "col-1",
    });
    expect(mockPrisma.collection.delete).toHaveBeenCalledWith({
      where: { id: "col-1", userId: "user-1" },
      select: { id: true },
    });
  });

  it("returns null for unknown or other users' collections", async () => {
    mockPrisma.collection.delete.mockRejectedValue(notFoundError());

    await expect(deleteCollection("user-1", "col-other")).resolves.toBeNull();
  });

  it("rethrows other errors", async () => {
    mockPrisma.collection.delete.mockRejectedValue(new Error("db down"));

    await expect(deleteCollection("user-1", "col-1")).rejects.toThrow("db down");
  });
});

describe("setCollectionFavorite", () => {
  it("sets the given value on the user's collection", async () => {
    mockPrisma.collection.update.mockResolvedValue({
      id: "col-1",
      isFavorite: false,
    } as never);

    await expect(
      setCollectionFavorite("user-1", "col-1", false),
    ).resolves.toEqual({ id: "col-1", isFavorite: false });
    expect(mockPrisma.collection.update).toHaveBeenCalledWith({
      where: { id: "col-1", userId: "user-1" },
      data: { isFavorite: false },
      select: { id: true, isFavorite: true },
    });
  });

  it("returns null for unknown or other users' collections", async () => {
    mockPrisma.collection.update.mockRejectedValue(notFoundError());

    await expect(
      setCollectionFavorite("user-1", "col-other", true),
    ).resolves.toBeNull();
  });

  it("rethrows other errors", async () => {
    mockPrisma.collection.update.mockRejectedValue(new Error("db down"));

    await expect(setCollectionFavorite("user-1", "col-1", true)).rejects.toThrow(
      "db down",
    );
  });
});
