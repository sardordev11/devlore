import { refresh } from "next/cache";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { ownsCollections } from "@/lib/db/collections";
import {
  createItem as createItemQuery,
  deleteItem as deleteItemQuery,
  isFileKeyInUse,
  setItemFavorite,
  setItemPinned,
  updateItem as updateItemQuery,
} from "@/lib/db/items";
import { deleteFile } from "@/lib/r2";
import {
  createItem,
  deleteItem,
  toggleItemFavorite,
  toggleItemPin,
  updateItem,
} from "@/actions/items";

vi.mock("next/cache", () => ({ refresh: vi.fn() }));
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
vi.mock("@/lib/db/collections", () => ({ ownsCollections: vi.fn() }));
vi.mock("@/lib/db/billing", () => ({ getUserPlan: vi.fn() }));
vi.mock("@/lib/db/items", () => ({
  createItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
  isFileKeyInUse: vi.fn(),
  setItemFavorite: vi.fn(),
  setItemPinned: vi.fn(),
}));

// auth() is overloaded (session getter and middleware wrapper), so cast the mock
const mockAuth = vi.mocked(auth as () => Promise<unknown>);
const mockCreateItemQuery = vi.mocked(createItemQuery);
const mockUpdateItemQuery = vi.mocked(updateItemQuery);
const mockDeleteItemQuery = vi.mocked(deleteItemQuery);
const mockDeleteFile = vi.mocked(deleteFile);
const mockIsFileKeyInUse = vi.mocked(isFileKeyInUse);
const mockOwnsCollections = vi.mocked(ownsCollections);
const mockRefresh = vi.mocked(refresh);
const mockSetItemFavorite = vi.mocked(setItemFavorite);
const mockSetItemPinned = vi.mocked(setItemPinned);

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
    mockOwnsCollections.mockResolvedValue(true);
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
      collectionIds: [],
    });
    expect(result).toEqual({
      success: true,
      data: {
        ...ITEM,
        createdAt: "2026-01-15T00:00:00.000Z",
        updatedAt: "2026-01-15T00:00:00.000Z",
      },
    });
    // The refreshed page comes back with the action's response.
    expect(mockRefresh).toHaveBeenCalledOnce();
  });

  it("checks the collections belong to the session user", async () => {
    mockCreateItemQuery.mockResolvedValue(ITEM);

    await createItem({ ...input, collectionIds: ["col-1", "col-2", "col-1"] });

    expect(mockOwnsCollections).toHaveBeenCalledWith("user-1", ["col-1", "col-2"]);
    expect(mockCreateItemQuery).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ collectionIds: ["col-1", "col-2"] }),
    );
  });

  it("refuses another user's collection without creating the item", async () => {
    mockOwnsCollections.mockResolvedValue(false);

    const result = await createItem({ ...input, collectionIds: ["col-other"] });

    expect(result).toEqual({
      success: false,
      error: "Collection not found",
      fieldErrors: { collectionIds: ["Collection not found"] },
    });
    expect(mockCreateItemQuery).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("returns an error when the type is missing from the database", async () => {
    mockCreateItemQuery.mockResolvedValue(null);

    const result = await createItem(input);
    expect(result).toEqual({ success: false, error: "Item type not found" });
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("returns a friendly error when the database fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockCreateItemQuery.mockRejectedValue(new Error("db down"));

    const result = await createItem(input);
    expect(result).toEqual({
      success: false,
      error: "Couldn't create the item. Please try again.",
    });
    expect(mockRefresh).not.toHaveBeenCalled();
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
    mockOwnsCollections.mockResolvedValue(true);
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

  it("removes the upload when a collection isn't the user's", async () => {
    mockIsFileKeyInUse.mockResolvedValue(false);
    mockOwnsCollections.mockResolvedValue(false);

    await createItem({ ...input, collectionIds: ["col-other"] });

    expect(mockDeleteFile).toHaveBeenCalledWith(file.key);
    expect(mockCreateItemQuery).not.toHaveBeenCalled();
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
    mockOwnsCollections.mockResolvedValue(true);
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

  it("skips the collection check when collectionIds is omitted", async () => {
    mockUpdateItemQuery.mockResolvedValue(ITEM);

    await updateItem("item-1", input);

    expect(mockOwnsCollections).not.toHaveBeenCalled();
  });

  it("saves the collections when they belong to the session user", async () => {
    mockUpdateItemQuery.mockResolvedValue(ITEM);

    await updateItem("item-1", { ...input, collectionIds: ["col-1"] });

    expect(mockOwnsCollections).toHaveBeenCalledWith("user-1", ["col-1"]);
    expect(mockUpdateItemQuery).toHaveBeenCalledWith(
      "user-1",
      "item-1",
      expect.objectContaining({ collectionIds: ["col-1"] }),
    );
  });

  it("refuses another user's collection without saving", async () => {
    mockOwnsCollections.mockResolvedValue(false);

    const result = await updateItem("item-1", { ...input, collectionIds: ["col-other"] });

    expect(result).toEqual({
      success: false,
      error: "Collection not found",
      fieldErrors: { collectionIds: ["Collection not found"] },
    });
    expect(mockUpdateItemQuery).not.toHaveBeenCalled();
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
    mockOwnsCollections.mockResolvedValue(true);
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

describe("toggleItemFavorite", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
  });

  it("requires a session", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await toggleItemFavorite("item-1", true);

    expect(result).toEqual({ success: false, error: "You must be signed in" });
    expect(mockSetItemFavorite).not.toHaveBeenCalled();
  });

  it.each([["", true], [123, true], ["item-1", "yes"], ["item-1", undefined]])(
    "rejects invalid input %j, %j",
    async (itemId, isFavorite) => {
      const result = await toggleItemFavorite(itemId, isFavorite);

      expect(result.success).toBe(false);
      expect(mockSetItemFavorite).not.toHaveBeenCalled();
    },
  );

  it("sets the value for the session user and refreshes the page", async () => {
    mockSetItemFavorite.mockResolvedValue({ id: "item-1", isFavorite: true });

    const result = await toggleItemFavorite("item-1", true);

    expect(result).toEqual({
      success: true,
      data: { id: "item-1", isFavorite: true },
    });
    expect(mockSetItemFavorite).toHaveBeenCalledWith("user-1", "item-1", true);
    expect(mockRefresh).toHaveBeenCalledOnce();
  });

  it("returns not found for unknown or other users' items", async () => {
    mockSetItemFavorite.mockResolvedValue(null);

    const result = await toggleItemFavorite("item-other", false);

    expect(result).toEqual({ success: false, error: "Item not found" });
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("returns a friendly error when the query fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockSetItemFavorite.mockRejectedValue(new Error("db down"));

    const result = await toggleItemFavorite("item-1", true);

    expect(result).toEqual({
      success: false,
      error: "Couldn't update favorites. Please try again.",
    });
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});

describe("toggleItemPin", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
  });

  it("requires a session", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await toggleItemPin("item-1", true);

    expect(result).toEqual({ success: false, error: "You must be signed in" });
    expect(mockSetItemPinned).not.toHaveBeenCalled();
  });

  it.each([["", true], [123, true], ["item-1", "yes"], ["item-1", undefined]])(
    "rejects invalid input %j, %j",
    async (itemId, isPinned) => {
      const result = await toggleItemPin(itemId, isPinned);

      expect(result.success).toBe(false);
      expect(mockSetItemPinned).not.toHaveBeenCalled();
    },
  );

  it("sets the value for the session user and refreshes the page", async () => {
    mockSetItemPinned.mockResolvedValue({ id: "item-1", isPinned: true });

    const result = await toggleItemPin("item-1", true);

    expect(result).toEqual({
      success: true,
      data: { id: "item-1", isPinned: true },
    });
    expect(mockSetItemPinned).toHaveBeenCalledWith("user-1", "item-1", true);
    expect(mockRefresh).toHaveBeenCalledOnce();
  });

  it("returns not found for unknown or other users' items", async () => {
    mockSetItemPinned.mockResolvedValue(null);

    const result = await toggleItemPin("item-other", false);

    expect(result).toEqual({ success: false, error: "Item not found" });
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("returns a friendly error when the query fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockSetItemPinned.mockRejectedValue(new Error("db down"));

    const result = await toggleItemPin("item-1", true);

    expect(result).toEqual({
      success: false,
      error: "Couldn't update the pin. Please try again.",
    });
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});

describe("createItem plan limits", () => {
  const snippet = { type: "snippets", title: "useAuth Hook", tags: [] };
  const upload = {
    type: "images",
    title: "Diagram",
    tags: [],
    file: {
      key: "users/user-1/0b6f4c1e-2d3a-4b5c-8d9e-0f1a2b3c4d5e.png",
      fileName: "diagram.png",
      fileSize: 1024,
      mimeType: "image/png",
    },
  };

  // ENFORCE_PLAN_LIMITS is read at import time, so re-import the action and
  // its (freshly mocked) dependencies with the flag set
  async function load(
    enforce: boolean,
    plan: { isPro: boolean; itemCount: number; collectionCount: number },
  ) {
    vi.resetModules();
    vi.stubEnv("ENFORCE_PLAN_LIMITS", enforce ? "true" : "");
    const [{ createItem }, authModule, billing, items, collections, r2] =
      await Promise.all([
        import("@/actions/items"),
        import("@/auth"),
        import("@/lib/db/billing"),
        import("@/lib/db/items"),
        import("@/lib/db/collections"),
        import("@/lib/r2"),
      ]);
    vi.mocked(authModule.auth as () => Promise<unknown>).mockResolvedValue({
      user: { id: "user-1" },
      expires: "",
    });
    vi.mocked(billing.getUserPlan).mockResolvedValue(plan);
    vi.mocked(collections.ownsCollections).mockResolvedValue(true);
    vi.mocked(items.isFileKeyInUse).mockResolvedValue(false);
    vi.mocked(items.createItem).mockResolvedValue(ITEM);
    return {
      createItem,
      createItemQuery: vi.mocked(items.createItem),
      getUserPlan: vi.mocked(billing.getUserPlan),
      deleteFile: vi.mocked(r2.deleteFile),
    };
  }

  const FREE = { isPro: false, itemCount: 0, collectionCount: 0 };

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows the 51st item when limits aren't enforced", async () => {
    const actions = await load(false, { ...FREE, itemCount: 50 });

    const result = await actions.createItem(snippet);

    expect(result.success).toBe(true);
    expect(actions.getUserPlan).not.toHaveBeenCalled();
  });

  it("allows the 50th item when enforced", async () => {
    const actions = await load(true, { ...FREE, itemCount: 49 });

    expect((await actions.createItem(snippet)).success).toBe(true);
    expect(actions.getUserPlan).toHaveBeenCalledWith("user-1");
  });

  it("rejects the 51st item with the upgrade flag when enforced", async () => {
    const actions = await load(true, { ...FREE, itemCount: 50 });

    const result = await actions.createItem(snippet);

    expect(result).toEqual({
      success: false,
      error: "Free accounts can have up to 50 items. Upgrade to Pro for unlimited items.",
      upgrade: true,
    });
    expect(actions.createItemQuery).not.toHaveBeenCalled();
  });

  it("rejects File and Image for free users and removes the upload", async () => {
    const actions = await load(true, FREE);

    const result = await actions.createItem(upload);

    expect(result).toEqual({
      success: false,
      error: "File and image uploads are a Pro feature. Upgrade to Pro to upload files.",
      upgrade: true,
    });
    expect(actions.deleteFile).toHaveBeenCalledWith(upload.file.key);
    expect(actions.createItemQuery).not.toHaveBeenCalled();
  });

  it("leaves Pro users unrestricted", async () => {
    const actions = await load(true, { isPro: true, itemCount: 500, collectionCount: 0 });

    expect((await actions.createItem(snippet)).success).toBe(true);
    expect((await actions.createItem(upload)).success).toBe(true);
    expect(actions.deleteFile).not.toHaveBeenCalled();
  });
});
