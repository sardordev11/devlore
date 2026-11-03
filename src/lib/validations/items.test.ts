import { describe, expect, it } from "vitest";

import {
  createItemSchema,
  MARKDOWN_TYPE_SLUGS,
  parseTags,
  updateItemSchema,
} from "@/lib/validations/items";

describe("MARKDOWN_TYPE_SLUGS", () => {
  it("covers notes and prompts only", () => {
    expect([...MARKDOWN_TYPE_SLUGS].sort()).toEqual(["notes", "prompts"]);
  });
});

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

describe("createItemSchema", () => {
  const base = { type: "snippets", title: "useAuth Hook", tags: [] };

  it("rejects unknown and non-creatable types", () => {
    for (const type of ["files", "images", "widgets", undefined]) {
      expect(createItemSchema.safeParse({ ...base, type }).success).toBe(false);
    }
  });

  it("requires a title", () => {
    const result = createItemSchema.safeParse({ ...base, title: "  " });
    expect(result.success).toBe(false);
  });

  it("requires a URL for links", () => {
    const result = createItemSchema.safeParse({ ...base, type: "links" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({
      path: ["url"],
      message: "URL is required",
    });
    expect(
      createItemSchema.safeParse({ ...base, type: "links", url: "javascript:x" })
        .success,
    ).toBe(false);
  });

  it("keeps only the fields the type uses", () => {
    const fields = {
      content: "body",
      language: "ts",
      url: "https://react.dev",
    };

    expect(createItemSchema.parse({ ...base, ...fields })).toMatchObject({
      content: "body",
      language: "ts",
      url: null,
    });
    expect(
      createItemSchema.parse({ ...base, ...fields, type: "prompts" }),
    ).toMatchObject({ content: "body", language: null, url: null });
    expect(
      createItemSchema.parse({ ...base, ...fields, type: "links" }),
    ).toMatchObject({ content: null, language: null, url: "https://react.dev" });
  });

  it("stores blank optional text as null and dedupes tags", () => {
    const data = createItemSchema.parse({
      ...base,
      description: " ",
      content: "",
      tags: ["react", "react"],
    });

    expect(data).toEqual({
      type: "snippets",
      title: "useAuth Hook",
      description: null,
      content: null,
      language: null,
      url: null,
      tags: ["react"],
    });
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
