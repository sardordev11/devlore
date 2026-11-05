import { describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import {
  createItem,
  deleteItem,
  getItemDetail,
  getItemFile,
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
