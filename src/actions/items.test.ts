import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import {
  createItem as createItemQuery,
  deleteItem as deleteItemQuery,
  isFileKeyInUse,
  updateItem as updateItemQuery,
} from "@/lib/db/items";
import { deleteFile } from "@/lib/r2";
import { createItem, deleteItem, updateItem } from "@/actions/items";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/r2", async (importOriginal) => ({
  isOwnedFileKey: (await importOriginal<typeof import("@/lib/r2")>())
    .isOwnedFileKey,
  getFileKey: (url: string) =>
    url.startsWith("https://files.example.com/")
      ? url.slice("https://files.example.com/".length)
      : null,
  deleteFile: vi.fn(),
}));
vi.mock("@/lib/db/items", () => ({
  createItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
  isFileKeyInUse: vi.fn(),
}));

// auth() is overloaded (session getter and middleware wrapper), so cast the mock
const mockAuth = vi.mocked(auth as () => Promise<unknown>);
const mockCreateItemQuery = vi.mocked(createItemQuery);
const mockUpdateItemQuery = vi.mocked(updateItemQuery);
const mockDeleteItemQuery = vi.mocked(deleteItemQuery);
const mockDeleteFile = vi.mocked(deleteFile);
const mockIsFileKeyInUse = vi.mocked(isFileKeyInUse);

const date = new Date("2026-01-15T00:00:00Z");

const ITEM = {
  id: "item-1",
  title: "useAuth Hook",
  description: null,
  contentType: "TEXT" as const,
  content: "export function useAuth() {}",
  language: "typescript",
  url: null,
  fileUrl: null,
  fileName: null,
  fileSize: null,
  mimeType: null,
  isFavorite: false,
  isPinned: false,
  createdAt: date,
  updatedAt: date,
  type: {
    id: "type-1",
    name: "snippet",
    slug: "snippets",
    icon: "Code",
    color: "#3b82f6",
  },
  tags: ["auth", "react"],
  collections: [],
};

describe("createItem", () => {
  const input = {
    type: "snippets",
    title: "  useAuth Hook ",
    description: "",
    content: "export function useAuth() {}",
    language: "typescript",
    tags: ["react", "auth", "react"],
  };

  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" }, expires: "" });
  });

  it("requires a session", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await createItem(input);
    expect(result).toEqual({ success: false, error: "You must be signed in" });
    expect(mockCreateItemQuery).not.toHaveBeenCalled();
  });

  it("returns Zod errors without touching the database", async () => {
    const result = await createItem({ ...input, type: "links", title: " " });

    expect(result).toMatchObject({
      success: false,
      error: "Title is required",
      fieldErrors: {
        title: ["Title is required"],
        url: ["URL is required"],
      },
    });
    expect(mockCreateItemQuery).not.toHaveBeenCalled();
  });

  it("creates the parsed input for the session user", async () => {
    mockCreateItemQuery.mockResolvedValue(ITEM);

    const result = await createItem(input);

    expect(mockCreateItemQuery).toHaveBeenCalledWith("user-1", {
      type: "snippets",
      title: "useAuth Hook",
      description: null,
      content: "export function useAuth() {}",
      language: "typescript",
      url: null,
      tags: ["react", "auth"],
      file: null,
    });
    expect(result).toEqual({
      success: true,
      data: {
        ...ITEM,
        createdAt: "2026-01-15T00:00:00.000Z",
        updatedAt: "2026-01-15T00:00:00.000Z",
      },
    });
  });

  it("returns an error when the type is missing from the database", async () => {
    mockCreateItemQuery.mockResolvedValue(null);

    const result = await createItem(input);
    expect(result).toEqual({ success: false, error: "Item type not found" });
  });

  it("returns a friendly error when the database fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockCreateItemQuery.mockRejectedValue(new Error("db down"));

    const result = await createItem(input);
    expect(result).toEqual({
      success: false,
      error: "Couldn't create the item. Please try again.",
    });
  });
});

describe("createItem with an uploaded file", () => {
  const file = {
    key: "users/user-1/0b6f4c1e-2d3a-4b5c-8d9e-0f1a2b3c4d5e.pdf",
    fileName: "spec.pdf",
    fileSize: 1024,
    mimeType: "application/pdf",
  };
  const input = { type: "files", title: "Spec", tags: [], file };

  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" }, expires: "" });
  });

  it("creates the item with the user's uploaded file", async () => {
    mockCreateItemQuery.mockResolvedValue({ ...ITEM, contentType: "FILE" });

    const result = await createItem(input);

    expect(result.success).toBe(true);
    expect(mockCreateItemQuery).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ type: "files", file }),
    );
    expect(mockDeleteFile).not.toHaveBeenCalled();
  });

  it("refuses a file key outside the user's prefix and leaves it alone", async () => {
    const result = await createItem({
      ...input,
      file: { ...file, key: file.key.replace("user-1", "user-2") },
    });

    expect(result).toMatchObject({ success: false, error: "File not found" });
    expect(mockCreateItemQuery).not.toHaveBeenCalled();
    expect(mockDeleteFile).not.toHaveBeenCalled();
  });

  it("refuses a file already attached to another item and leaves it alone", async () => {
    mockIsFileKeyInUse.mockResolvedValue(true);

    const result = await createItem(input);

    expect(mockIsFileKeyInUse).toHaveBeenCalledWith("user-1", file.key);
    expect(result).toEqual({
      success: false,
      error: "File is already attached to another item",
    });
    expect(mockCreateItemQuery).not.toHaveBeenCalled();
    expect(mockDeleteFile).not.toHaveBeenCalled();
  });

  it("removes the upload when validation fails", async () => {
    const result = await createItem({ ...input, title: " " });

    expect(result.success).toBe(false);
    expect(mockDeleteFile).toHaveBeenCalledWith(file.key);
  });

  it("removes the upload when the database fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockCreateItemQuery.mockRejectedValue(new Error("db down"));

    const result = await createItem(input);

    expect(result.success).toBe(false);
    expect(mockDeleteFile).toHaveBeenCalledWith(file.key);
  });
});

describe("updateItem", () => {
  const input = {
    title: "  useAuth Hook ",
    description: "",
    content: "export function useAuth() {}",
    language: "typescript",
    tags: ["react", "auth", "react"],
  };

  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" }, expires: "" });
  });

  it("requires a session", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await updateItem("item-1", input);
    expect(result).toEqual({ success: false, error: "You must be signed in" });
    expect(mockUpdateItemQuery).not.toHaveBeenCalled();
  });

  it("returns Zod errors without touching the database", async () => {
    const result = await updateItem("item-1", {
      ...input,
      title: " ",
      url: "javascript:alert(1)",
    });

    expect(result).toMatchObject({
      success: false,
      error: "Title is required",
      fieldErrors: {
        title: ["Title is required"],
        url: ["Enter a valid http(s) URL"],
      },
    });
    expect(mockUpdateItemQuery).not.toHaveBeenCalled();
  });

  it("saves the parsed input for the session user", async () => {
    mockUpdateItemQuery.mockResolvedValue(ITEM);

    const result = await updateItem("item-1", input);

    expect(mockUpdateItemQuery).toHaveBeenCalledWith("user-1", "item-1", {
      title: "useAuth Hook",
      description: null,
      content: "export function useAuth() {}",
      language: "typescript",
      tags: ["react", "auth"],
    });
    expect(result).toEqual({
      success: true,
      data: {
        ...ITEM,
        createdAt: "2026-01-15T00:00:00.000Z",
        updatedAt: "2026-01-15T00:00:00.000Z",
      },
    });
  });

  it("returns not found for another user's item", async () => {
    mockUpdateItemQuery.mockResolvedValue(null);

    const result = await updateItem("item-1", input);
    expect(result).toEqual({ success: false, error: "Item not found" });
  });

  it("returns a friendly error when the database fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockUpdateItemQuery.mockRejectedValue(new Error("db down"));

    const result = await updateItem("item-1", input);
    expect(result).toEqual({
      success: false,
      error: "Couldn't save the item. Please try again.",
    });
  });
});

describe("deleteItem", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" }, expires: "" });
  });

  it("requires a session", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await deleteItem("item-1");
    expect(result).toEqual({ success: false, error: "You must be signed in" });
    expect(mockDeleteItemQuery).not.toHaveBeenCalled();
  });

  it.each([[""], [123], [{ id: "item-1" }], ["x".repeat(101)]])(
    "rejects an invalid id (%j) without touching the database",
    async (itemId) => {
      const result = await deleteItem(itemId);
      expect(result).toEqual({ success: false, error: "Item not found" });
      expect(mockDeleteItemQuery).not.toHaveBeenCalled();
    },
  );

  it("deletes the item for the session user", async () => {
    mockDeleteItemQuery.mockResolvedValue({ fileUrl: null });

    const result = await deleteItem("item-1");
    expect(mockDeleteItemQuery).toHaveBeenCalledWith("user-1", "item-1");
    expect(result).toEqual({ success: true, data: { id: "item-1" } });
    expect(mockDeleteFile).not.toHaveBeenCalled();
  });

  it("deletes the item's file from R2", async () => {
    mockDeleteItemQuery.mockResolvedValue({
      fileUrl: "https://files.example.com/users/user-1/abc.pdf",
    });

    const result = await deleteItem("item-1");
    expect(result.success).toBe(true);
    expect(mockDeleteFile).toHaveBeenCalledWith("users/user-1/abc.pdf");
  });

  it("still succeeds when the R2 delete fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockDeleteItemQuery.mockResolvedValue({
      fileUrl: "https://files.example.com/users/user-1/abc.pdf",
    });
    mockDeleteFile.mockRejectedValue(new Error("r2 down"));

    const result = await deleteItem("item-1");
    expect(result).toEqual({ success: true, data: { id: "item-1" } });
  });

  it("returns not found for another user's item", async () => {
    mockDeleteItemQuery.mockResolvedValue(null);

    const result = await deleteItem("item-1");
    expect(result).toEqual({ success: false, error: "Item not found" });
  });

  it("returns a friendly error when the database fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockDeleteItemQuery.mockRejectedValue(new Error("db down"));

    const result = await deleteItem("item-1");
    expect(result).toEqual({
      success: false,
      error: "Couldn't delete the item. Please try again.",
    });
  });
});
