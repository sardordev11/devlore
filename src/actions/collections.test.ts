import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCollection, getCollectionOptions } from "@/actions/collections";
import { auth } from "@/auth";
import {
  createCollection as createCollectionQuery,
  getCollectionOptions as getCollectionOptionsQuery,
} from "@/lib/db/collections";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db/collections", () => ({
  createCollection: vi.fn(),
  getCollectionOptions: vi.fn(),
}));

// auth() is overloaded (session getter and middleware wrapper), so cast the mock
const mockAuth = vi.mocked(auth as () => Promise<unknown>);
const mockCreateCollectionQuery = vi.mocked(createCollectionQuery);
const mockGetCollectionOptionsQuery = vi.mocked(getCollectionOptionsQuery);

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
