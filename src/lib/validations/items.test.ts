import { describe, expect, it } from "vitest";

import { parseTags, updateItemSchema } from "@/lib/validations/items";

describe("updateItemSchema", () => {
  const base = { title: "useAuth Hook", tags: [] };

  it("trims the title and rejects a blank one", () => {
    expect(updateItemSchema.parse({ ...base, title: "  Hook  " }).title).toBe(
      "Hook",
    );
    expect(updateItemSchema.safeParse({ ...base, title: "   " }).success).toBe(
      false,
    );
  });

  it("stores blank optional text as null and leaves omitted fields undefined", () => {
    const data = updateItemSchema.parse({
      ...base,
      description: "  ",
      content: "",
      language: " ts ",
    });

    expect(data.description).toBeNull();
    expect(data.content).toBeNull();
    expect(data.language).toBe("ts");
    expect(data.url).toBeUndefined();
  });

  it("accepts http(s) URLs and clears a blank one", () => {
    expect(
      updateItemSchema.parse({ ...base, url: " https://react.dev " }).url,
    ).toBe("https://react.dev");
    expect(updateItemSchema.parse({ ...base, url: "" }).url).toBeNull();
  });

  it("rejects invalid and non-http URLs", () => {
    for (const url of ["not a url", "javascript:alert(1)", "ftp://x.io"]) {
      expect(updateItemSchema.safeParse({ ...base, url }).success).toBe(false);
    }
  });

  it("trims and dedupes tags and rejects empty ones", () => {
    expect(
      updateItemSchema.parse({ ...base, tags: [" react ", "hooks", "react"] })
        .tags,
    ).toEqual(["react", "hooks"]);
    expect(updateItemSchema.safeParse({ ...base, tags: [" "] }).success).toBe(
      false,
    );
  });
});

describe("parseTags", () => {
  it("splits on commas and drops blanks", () => {
    expect(parseTags(" react, hooks ,, auth ,")).toEqual([
      "react",
      "hooks",
      "auth",
    ]);
    expect(parseTags("")).toEqual([]);
  });
});
