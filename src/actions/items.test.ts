import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import {
  deleteItem as deleteItemQuery,
  updateItem as updateItemQuery,
} from "@/lib/db/items";
import { deleteItem, updateItem } from "@/actions/items";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db/items", () => ({ updateItem: vi.fn(), deleteItem: vi.fn() }));

// auth() is overloaded (session getter and middleware wrapper), so cast the mock
const mockAuth = vi.mocked(auth as () => Promise<unknown>);
const mockUpdateItemQuery = vi.mocked(updateItemQuery);
const mockDeleteItemQuery = vi.mocked(deleteItemQuery);

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
    mockDeleteItemQuery.mockResolvedValue(true);

    const result = await deleteItem("item-1");
    expect(mockDeleteItemQuery).toHaveBeenCalledWith("user-1", "item-1");
    expect(result).toEqual({ success: true, data: { id: "item-1" } });
  });

  it("returns not found for another user's item", async () => {
    mockDeleteItemQuery.mockResolvedValue(false);

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
