import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCollection } from "@/actions/collections";
import { auth } from "@/auth";
import { createCollection as createCollectionQuery } from "@/lib/db/collections";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db/collections", () => ({ createCollection: vi.fn() }));

// auth() is overloaded (session getter and middleware wrapper), so cast the mock
const mockAuth = vi.mocked(auth as () => Promise<unknown>);
const mockCreateCollectionQuery = vi.mocked(createCollectionQuery);

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
