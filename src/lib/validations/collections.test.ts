import { describe, expect, it } from "vitest";

import {
  COLLECTION_DESCRIPTION_MAX,
  COLLECTION_NAME_MAX,
  createCollectionSchema,
} from "@/lib/validations/collections";

describe("createCollectionSchema", () => {
  it("trims the name and description", () => {
    const result = createCollectionSchema.parse({
      name: "  React Patterns ",
      description: "  Hooks and components  ",
    });
    expect(result).toEqual({
      name: "React Patterns",
      description: "Hooks and components",
    });
  });

  it("stores a blank or missing description as null", () => {
    expect(createCollectionSchema.parse({ name: "A", description: "   " }).description).toBeNull();
    expect(createCollectionSchema.parse({ name: "A" }).description).toBeNull();
    expect(createCollectionSchema.parse({ name: "A", description: null }).description).toBeNull();
  });

  it("requires a name", () => {
    const result = createCollectionSchema.safeParse({ name: "   " });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Name is required");
  });

  it("rejects names and descriptions over the limits", () => {
    expect(
      createCollectionSchema.safeParse({ name: "a".repeat(COLLECTION_NAME_MAX + 1) }).success,
    ).toBe(false);
    expect(
      createCollectionSchema.safeParse({
        name: "A",
        description: "a".repeat(COLLECTION_DESCRIPTION_MAX + 1),
      }).success,
    ).toBe(false);
  });

  it("rejects a non-string name", () => {
    expect(createCollectionSchema.safeParse({ name: 42 }).success).toBe(false);
  });
});
