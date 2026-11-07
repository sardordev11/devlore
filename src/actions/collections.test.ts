import { beforeEach, describe, expect, it, vi } from "vitest";

import { refresh } from "next/cache";

import {
  createCollection,
  deleteCollection,
  getCollectionOptions,
  toggleCollectionFavorite,
  updateCollection,
} from "@/actions/collections";
import { auth } from "@/auth";
import {
  createCollection as createCollectionQuery,
  deleteCollection as deleteCollectionQuery,
  getCollectionOptions as getCollectionOptionsQuery,
  setCollectionFavorite,
  updateCollection as updateCollectionQuery,
} from "@/lib/db/collections";

vi.mock("next/cache", () => ({ refresh: vi.fn() }));
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db/collections", () => ({
  createCollection: vi.fn(),
  deleteCollection: vi.fn(),
  getCollectionOptions: vi.fn(),
  setCollectionFavorite: vi.fn(),
  updateCollection: vi.fn(),
}));

// auth() is overloaded (session getter and middleware wrapper), so cast the mock
const mockAuth = vi.mocked(auth as () => Promise<unknown>);
const mockCreateCollectionQuery = vi.mocked(createCollectionQuery);
const mockGetCollectionOptionsQuery = vi.mocked(getCollectionOptionsQuery);
const mockUpdateCollectionQuery = vi.mocked(updateCollectionQuery);
const mockDeleteCollectionQuery = vi.mocked(deleteCollectionQuery);
const mockSetCollectionFavorite = vi.mocked(setCollectionFavorite);
const mockRefresh = vi.mocked(refresh);

const COLLECTION = {
  id: "col-1",
  name: "React Patterns",
  description: "Hooks and components",
};

describe("createCollection", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
  });

  it("requires a session", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await createCollection({ name: "React Patterns" });

    expect(result).toEqual({ success: false, error: "You must be signed in" });
    expect(mockCreateCollectionQuery).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid input", async () => {
    const result = await createCollection({ name: "  " });

    expect(result).toMatchObject({
      success: false,
      error: "Name is required",
      fieldErrors: { name: ["Name is required"] },
    });
    expect(mockCreateCollectionQuery).not.toHaveBeenCalled();
  });

  it("creates the collection for the session user with parsed input", async () => {
    mockCreateCollectionQuery.mockResolvedValue(COLLECTION);

    const result = await createCollection({
      name: " React Patterns ",
      description: " Hooks and components ",
      userId: "someone-else",
    });

    expect(result).toEqual({ success: true, data: COLLECTION });
    expect(mockCreateCollectionQuery).toHaveBeenCalledWith("user-1", {
      name: "React Patterns",
      description: "Hooks and components",
    });
  });

  it("returns a friendly error when the query fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockCreateCollectionQuery.mockRejectedValue(new Error("db down"));

    const result = await createCollection({ name: "React Patterns" });

    expect(result).toEqual({
      success: false,
      error: "Couldn't create the collection. Please try again.",
    });
  });
});

describe("getCollectionOptions", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
  });

  it("requires a session", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await getCollectionOptions();

    expect(result).toEqual({ success: false, error: "You must be signed in" });
    expect(mockGetCollectionOptionsQuery).not.toHaveBeenCalled();
  });

  it("returns the session user's collections", async () => {
    const options = [{ id: "col-1", name: "React Patterns" }];
    mockGetCollectionOptionsQuery.mockResolvedValue(options);

    const result = await getCollectionOptions();

    expect(result).toEqual({ success: true, data: options });
    expect(mockGetCollectionOptionsQuery).toHaveBeenCalledWith("user-1");
  });

  it("returns a friendly error when the query fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetCollectionOptionsQuery.mockRejectedValue(new Error("db down"));

    const result = await getCollectionOptions();

    expect(result).toEqual({ success: false, error: "Couldn't load your collections" });
  });
});

describe("updateCollection", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
  });

  it("requires a session", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await updateCollection("col-1", { name: "Renamed" });

    expect(result).toEqual({ success: false, error: "You must be signed in" });
    expect(mockUpdateCollectionQuery).not.toHaveBeenCalled();
  });

  it("rejects an invalid id", async () => {
    const result = await updateCollection("", { name: "Renamed" });

    expect(result).toEqual({ success: false, error: "Collection not found" });
    expect(mockUpdateCollectionQuery).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid input", async () => {
    const result = await updateCollection("col-1", { name: " " });

    expect(result).toMatchObject({
      success: false,
      error: "Name is required",
      fieldErrors: { name: ["Name is required"] },
    });
    expect(mockUpdateCollectionQuery).not.toHaveBeenCalled();
  });

  it("updates the session user's collection with parsed input", async () => {
    mockUpdateCollectionQuery.mockResolvedValue(COLLECTION);

    const result = await updateCollection("col-1", {
      name: " React Patterns ",
      description: " Hooks and components ",
      userId: "someone-else",
    });

    expect(result).toEqual({ success: true, data: COLLECTION });
    expect(mockUpdateCollectionQuery).toHaveBeenCalledWith("user-1", "col-1", {
      name: "React Patterns",
      description: "Hooks and components",
    });
  });

  it("returns not found for other users' collections", async () => {
    mockUpdateCollectionQuery.mockResolvedValue(null);

    const result = await updateCollection("col-other", { name: "Renamed" });

    expect(result).toEqual({ success: false, error: "Collection not found" });
  });

  it("returns a friendly error when the query fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockUpdateCollectionQuery.mockRejectedValue(new Error("db down"));

    const result = await updateCollection("col-1", { name: "Renamed" });

    expect(result).toEqual({
      success: false,
      error: "Couldn't update the collection. Please try again.",
    });
  });
});

describe("deleteCollection", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
  });

  it("requires a session", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await deleteCollection("col-1");

    expect(result).toEqual({ success: false, error: "You must be signed in" });
    expect(mockDeleteCollectionQuery).not.toHaveBeenCalled();
  });

  it("rejects an invalid id", async () => {
    const result = await deleteCollection(42);

    expect(result).toEqual({ success: false, error: "Collection not found" });
    expect(mockDeleteCollectionQuery).not.toHaveBeenCalled();
  });

  it("deletes the session user's collection", async () => {
    mockDeleteCollectionQuery.mockResolvedValue({ id: "col-1" });

    const result = await deleteCollection("col-1");

    expect(result).toEqual({ success: true, data: { id: "col-1" } });
    expect(mockDeleteCollectionQuery).toHaveBeenCalledWith("user-1", "col-1");
  });

  it("returns not found for other users' collections", async () => {
    mockDeleteCollectionQuery.mockResolvedValue(null);

    const result = await deleteCollection("col-other");

    expect(result).toEqual({ success: false, error: "Collection not found" });
  });

  it("returns a friendly error when the query fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockDeleteCollectionQuery.mockRejectedValue(new Error("db down"));

    const result = await deleteCollection("col-1");

    expect(result).toEqual({
      success: false,
      error: "Couldn't delete the collection. Please try again.",
    });
  });
});

describe("toggleCollectionFavorite", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
  });

  it("requires a session", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await toggleCollectionFavorite("col-1", true);

    expect(result).toEqual({ success: false, error: "You must be signed in" });
    expect(mockSetCollectionFavorite).not.toHaveBeenCalled();
  });

  it.each([["", true], [null, true], ["col-1", "true"], ["col-1", 1]])(
    "rejects invalid input %j, %j",
    async (collectionId, isFavorite) => {
      const result = await toggleCollectionFavorite(collectionId, isFavorite);

      expect(result.success).toBe(false);
      expect(mockSetCollectionFavorite).not.toHaveBeenCalled();
    },
  );

  it("sets the value for the session user and refreshes the page", async () => {
    mockSetCollectionFavorite.mockResolvedValue({
      id: "col-1",
      isFavorite: false,
    });

    const result = await toggleCollectionFavorite("col-1", false);

    expect(result).toEqual({
      success: true,
      data: { id: "col-1", isFavorite: false },
    });
    expect(mockSetCollectionFavorite).toHaveBeenCalledWith(
      "user-1",
      "col-1",
      false,
    );
    expect(mockRefresh).toHaveBeenCalledOnce();
  });

  it("returns not found for unknown or other users' collections", async () => {
    mockSetCollectionFavorite.mockResolvedValue(null);

    const result = await toggleCollectionFavorite("col-other", true);

    expect(result).toEqual({ success: false, error: "Collection not found" });
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("returns a friendly error when the query fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockSetCollectionFavorite.mockRejectedValue(new Error("db down"));

    const result = await toggleCollectionFavorite("col-1", true);

    expect(result).toEqual({
      success: false,
      error: "Couldn't update favorites. Please try again.",
    });
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
