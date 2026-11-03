import { describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import {
  createItem,
  deleteItem,
  getItemDetail,
  updateItem,
} from "@/lib/db/items";
import { prisma } from "@/lib/prisma";

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
  it("deletes only the user's item", async () => {
    mockPrisma.item.delete.mockResolvedValue({ id: "item-1" } as never);

    await expect(deleteItem("user-1", "item-1")).resolves.toBe(true);
    expect(mockPrisma.item.delete).toHaveBeenCalledWith({
      where: { id: "item-1", userId: "user-1" },
      select: { id: true },
    });
  });

  it("returns false when the item isn't found for the user", async () => {
    mockPrisma.item.delete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "7",
      }),
    );

    await expect(deleteItem("user-2", "item-1")).resolves.toBe(false);
  });

  it("rethrows other database errors", async () => {
    mockPrisma.item.delete.mockRejectedValue(new Error("db down"));

    await expect(deleteItem("user-1", "item-1")).rejects.toThrow("db down");
  });
});
