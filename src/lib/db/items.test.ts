import { describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import {
  createItem,
  deleteItem,
  getItemDetail,
  getItemFile,
  getItemsByCollection,
  getItemsByTypeSlug,
  getSearchItems,
  isFileKeyInUse,
  updateItem,
} from "@/lib/db/items";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/r2", () => ({
  getFileUrl: (key: string) => `https://files.example.com/${key}`,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    itemType: { findFirst: vi.fn() },
  },
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
  fileSize: null,
  mimeType: null,
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

describe("createItem", () => {
  const input = {
    type: "snippets" as const,
    title: "useAuth Hook",
    description: null,
    content: "export function useAuth() {}",
    language: "typescript",
    url: null,
    tags: ["auth"],
    file: null,
    collectionIds: [],
  };

  it("looks up the system type by slug", async () => {
    mockPrisma.itemType.findFirst.mockResolvedValue(null as never);

    await expect(createItem("user-1", input)).resolves.toBeNull();
    expect(mockPrisma.itemType.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: "snippets", isSystem: true } }),
    );
    expect(mockPrisma.item.create).not.toHaveBeenCalled();
  });

  it("creates the item for the user with the type's content type and tags", async () => {
    mockPrisma.itemType.findFirst.mockResolvedValue({
      id: "type-1",
      contentType: "TEXT",
    } as never);
    mockPrisma.item.create.mockResolvedValue(ROW as never);

    const item = await createItem("user-1", input);

    expect(mockPrisma.item.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          title: "useAuth Hook",
          description: null,
          content: "export function useAuth() {}",
          language: "typescript",
          url: null,
          contentType: "TEXT",
          userId: "user-1",
          typeId: "type-1",
          tags: {
            connectOrCreate: [
              {
                where: { userId_name: { userId: "user-1", name: "auth" } },
                create: { name: "auth", userId: "user-1" },
              },
            ],
          },
          collections: { create: [] },
        },
      }),
    );
    expect(item).toEqual({
      ...ROW,
      tags: ["auth", "react"],
      collections: [{ id: "col-1", name: "React Patterns" }],
    });
  });
});

describe("createItem with collections", () => {
  it("links the item to the given collections", async () => {
    mockPrisma.itemType.findFirst.mockResolvedValue({
      id: "type-1",
      contentType: "TEXT",
    } as never);
    mockPrisma.item.create.mockResolvedValue(ROW as never);

    await createItem("user-1", {
      type: "notes",
      title: "Note",
      description: null,
      content: null,
      language: null,
      url: null,
      tags: [],
      file: null,
      collectionIds: ["col-1", "col-2"],
    });

    expect(mockPrisma.item.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          collections: {
            create: [{ collectionId: "col-1" }, { collectionId: "col-2" }],
          },
        }),
      }),
    );
  });
});

describe("createItem with a file", () => {
  it("stores the public URL and file details", async () => {
    mockPrisma.itemType.findFirst.mockResolvedValue({
      id: "type-6",
      contentType: "FILE",
    } as never);
    mockPrisma.item.create.mockResolvedValue(ROW as never);

    await createItem("user-1", {
      type: "files",
      title: "Spec",
      description: null,
      content: null,
      language: null,
      url: null,
      tags: [],
      collectionIds: [],
      file: {
        key: "users/user-1/abc.pdf",
        fileName: "spec.pdf",
        fileSize: 1024,
        mimeType: "application/pdf",
      },
    });

    expect(mockPrisma.item.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          contentType: "FILE",
          fileUrl: "https://files.example.com/users/user-1/abc.pdf",
          fileName: "spec.pdf",
          fileSize: 1024,
          mimeType: "application/pdf",
        }),
      }),
    );
  });
});

describe("isFileKeyInUse", () => {
  const key = "users/user-1/abc.pdf";

  it("looks up the user's items by the key's public URL", async () => {
    mockPrisma.item.findFirst.mockResolvedValue({ id: "item-1" } as never);

    await expect(isFileKeyInUse("user-1", key)).resolves.toBe(true);
    expect(mockPrisma.item.findFirst).toHaveBeenCalledWith({
      where: { userId: "user-1", fileUrl: `https://files.example.com/${key}` },
      select: { id: true },
    });
  });

  it("returns false when no item stores the file", async () => {
    mockPrisma.item.findFirst.mockResolvedValue(null as never);

    await expect(isFileKeyInUse("user-1", key)).resolves.toBe(false);
  });
});

describe("getItemFile", () => {
  it("scopes the lookup to the user's file items", async () => {
    mockPrisma.item.findFirst.mockResolvedValue(null as never);

    await expect(getItemFile("user-1", "item-1")).resolves.toBeNull();
    expect(mockPrisma.item.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "item-1", userId: "user-1", contentType: "FILE" },
      }),
    );
  });

  it("returns the file when it has a URL and name", async () => {
    const file = {
      fileUrl: "https://files.example.com/users/user-1/abc.pdf",
      fileName: "spec.pdf",
      mimeType: "application/pdf",
    };
    mockPrisma.item.findFirst.mockResolvedValue(file as never);

    await expect(getItemFile("user-1", "item-1")).resolves.toEqual(file);
  });

  it("returns null for a file item without a stored file", async () => {
    mockPrisma.item.findFirst.mockResolvedValue({
      fileUrl: null,
      fileName: null,
      mimeType: null,
    } as never);

    await expect(getItemFile("user-1", "item-1")).resolves.toBeNull();
  });
});

describe("updateItem", () => {
  const input = {
    title: "useAuth Hook",
    description: null,
    content: "export function useAuth() {}",
    tags: ["auth", "react"],
  };

  it("updates only the user's item and replaces its tags", async () => {
    mockPrisma.item.update.mockResolvedValue(ROW as never);

    await updateItem("user-1", "item-1", input);

    expect(mockPrisma.item.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "item-1", userId: "user-1" },
        data: {
          title: "useAuth Hook",
          description: null,
          content: "export function useAuth() {}",
          tags: {
            set: [],
            connectOrCreate: [
              {
                where: { userId_name: { userId: "user-1", name: "auth" } },
                create: { name: "auth", userId: "user-1" },
              },
              {
                where: { userId_name: { userId: "user-1", name: "react" } },
                create: { name: "react", userId: "user-1" },
              },
            ],
          },
        },
      }),
    );
  });

  it("leaves collections alone when collectionIds is omitted", async () => {
    mockPrisma.item.update.mockResolvedValue(ROW as never);

    await updateItem("user-1", "item-1", input);

    const [args] = mockPrisma.item.update.mock.calls[0];
    expect(args.data).not.toHaveProperty("collections");
  });

  it("replaces collections, keeping existing links via connectOrCreate", async () => {
    mockPrisma.item.update.mockResolvedValue(ROW as never);

    await updateItem("user-1", "item-1", { ...input, collectionIds: ["col-1", "col-2"] });

    expect(mockPrisma.item.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          collections: {
            deleteMany: { collectionId: { notIn: ["col-1", "col-2"] } },
            connectOrCreate: [
              {
                where: { itemId_collectionId: { itemId: "item-1", collectionId: "col-1" } },
                create: { collectionId: "col-1" },
              },
              {
                where: { itemId_collectionId: { itemId: "item-1", collectionId: "col-2" } },
                create: { collectionId: "col-2" },
              },
            ],
          },
        }),
      }),
    );
  });

  it("removes the item from every collection for an empty list", async () => {
    mockPrisma.item.update.mockResolvedValue(ROW as never);

    await updateItem("user-1", "item-1", { ...input, collectionIds: [] });

    expect(mockPrisma.item.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          collections: {
            deleteMany: { collectionId: { notIn: [] } },
            connectOrCreate: [],
          },
        }),
      }),
    );
  });

  it("returns the updated item detail", async () => {
    mockPrisma.item.update.mockResolvedValue(ROW as never);

    await expect(updateItem("user-1", "item-1", input)).resolves.toEqual({
      ...ROW,
      tags: ["auth", "react"],
      collections: [{ id: "col-1", name: "React Patterns" }],
    });
  });

  it("returns null when the item isn't found for the user", async () => {
    mockPrisma.item.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "7",
      }),
    );

    await expect(updateItem("user-2", "item-1", input)).resolves.toBeNull();
  });

  it("rethrows other database errors", async () => {
    mockPrisma.item.update.mockRejectedValue(new Error("db down"));

    await expect(updateItem("user-1", "item-1", input)).rejects.toThrow(
      "db down",
    );
  });
});

describe("deleteItem", () => {
  it("deletes only the user's item and returns its file URL", async () => {
    mockPrisma.item.delete.mockResolvedValue({ fileUrl: null } as never);

    await expect(deleteItem("user-1", "item-1")).resolves.toEqual({
      fileUrl: null,
    });
    expect(mockPrisma.item.delete).toHaveBeenCalledWith({
      where: { id: "item-1", userId: "user-1" },
      select: { fileUrl: true },
    });
  });

  it("returns null when the item isn't found for the user", async () => {
    mockPrisma.item.delete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "7",
      }),
    );

    await expect(deleteItem("user-2", "item-1")).resolves.toBeNull();
  });

  it("rethrows other database errors", async () => {
    mockPrisma.item.delete.mockRejectedValue(new Error("db down"));

    await expect(deleteItem("user-1", "item-1")).rejects.toThrow("db down");
  });
});

const SUMMARY_ROW = {
  id: "item-1",
  title: "useAuth Hook",
  description: null,
  isFavorite: false,
  isPinned: true,
  lastUsedAt: null,
  createdAt,
  fileUrl: null,
  fileName: null,
  fileSize: null,
  contentType: "TEXT",
  content: "export function useAuth() {}",
  url: null,
  type: { id: "type-1", name: "snippet", icon: "Code", color: "#3b82f6" },
  tags: [{ name: "auth" }],
};

const LISTING_ORDER = [
  { isPinned: "desc" },
  { lastUsedAt: { sort: "desc", nulls: "last" } },
  { updatedAt: "desc" },
  { id: "asc" },
];

describe("getItemsByCollection", () => {
  it("lists one page of the user's items in the collection, pinned first", async () => {
    mockPrisma.item.findMany.mockResolvedValue([SUMMARY_ROW] as never);
    mockPrisma.item.count.mockResolvedValue(25 as never);

    const { items, total } = await getItemsByCollection("user-1", "col-1", 2);

    expect(total).toBe(25);
    expect(items).toEqual([
      expect.objectContaining({
        id: "item-1",
        copyValue: "export function useAuth() {}",
        tags: ["auth"],
      }),
    ]);
    expect(items[0]).not.toHaveProperty("content");
    const where = {
      userId: "user-1",
      collections: { some: { collectionId: "col-1" } },
    };
    const [args] = mockPrisma.item.findMany.mock.calls[0];
    expect(args?.where).toEqual(where);
    expect(args?.orderBy).toEqual(LISTING_ORDER);
    expect(args?.skip).toBe(21);
    expect(args?.take).toBe(21);
    expect(mockPrisma.item.count).toHaveBeenCalledWith({ where });
  });
});

describe("getItemsByTypeSlug", () => {
  const TYPE = { name: "snippet", slug: "snippets", icon: "Code", color: "#3b82f6" };

  it("returns null without querying items when no type has the slug", async () => {
    mockPrisma.itemType.findFirst.mockResolvedValue(null);

    await expect(getItemsByTypeSlug("user-1", "nope")).resolves.toBeNull();
    expect(mockPrisma.item.findMany).not.toHaveBeenCalled();
    expect(mockPrisma.item.count).not.toHaveBeenCalled();
  });

  it("returns the type with one page of the user's items and the total", async () => {
    mockPrisma.itemType.findFirst.mockResolvedValue({ id: "type-1", ...TYPE } as never);
    mockPrisma.item.findMany.mockResolvedValue([SUMMARY_ROW] as never);
    mockPrisma.item.count.mockResolvedValue(1 as never);

    const listing = await getItemsByTypeSlug("user-1", "snippets");

    expect(listing).toEqual({
      type: TYPE,
      items: [expect.objectContaining({ id: "item-1" })],
      total: 1,
    });
    const [args] = mockPrisma.item.findMany.mock.calls[0];
    expect(args?.where).toEqual({ userId: "user-1", typeId: "type-1" });
    expect(args?.orderBy).toEqual(LISTING_ORDER);
    expect(args?.skip).toBe(0);
    expect(args?.take).toBe(21);
    expect(mockPrisma.item.count).toHaveBeenCalledWith({
      where: { userId: "user-1", typeId: "type-1" },
    });
  });
});

describe("getSearchItems", () => {
  it("scopes to the user and maps rows to search items with a preview", async () => {
    mockPrisma.item.findMany.mockResolvedValue([
      {
        id: "item-1",
        title: "useAuth Hook",
        contentType: "TEXT",
        content: "export function\n  useAuth() {}",
        url: null,
        fileName: null,
        type: { name: "snippet", icon: "Code", color: "#3b82f6" },
      },
      {
        id: "item-2",
        title: "Next.js docs",
        contentType: "URL",
        content: null,
        url: "https://nextjs.org/docs",
        fileName: null,
        type: { name: "link", icon: "Link", color: "#10b981" },
      },
    ] as never);

    const items = await getSearchItems("user-1");

    expect(mockPrisma.item.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } }),
    );
    expect(items).toEqual([
      {
        id: "item-1",
        title: "useAuth Hook",
        preview: "export function useAuth() {}",
        type: { name: "snippet", icon: "Code", color: "#3b82f6" },
      },
      {
        id: "item-2",
        title: "Next.js docs",
        preview: "https://nextjs.org/docs",
        type: { name: "link", icon: "Link", color: "#10b981" },
      },
    ]);
  });
});

describe("getSearchItems for files", () => {
  it("orders by recent use and previews files by their file name", async () => {
    mockPrisma.item.findMany.mockResolvedValue([
      {
        id: "item-3",
        title: "Architecture diagram",
        contentType: "FILE",
        content: null,
        url: null,
        fileName: "architecture.pdf",
        type: { name: "file", icon: "File", color: "#6b7280" },
      },
    ] as never);

    const [item] = await getSearchItems("user-1");

    expect(mockPrisma.item.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [
          { lastUsedAt: { sort: "desc", nulls: "last" } },
          { updatedAt: "desc" },
        ],
      }),
    );
    expect(item.preview).toBe("architecture.pdf");
  });

  it("returns an empty list when the user has no items", async () => {
    mockPrisma.item.findMany.mockResolvedValue([]);

    await expect(getSearchItems("user-1")).resolves.toEqual([]);
  });
});
