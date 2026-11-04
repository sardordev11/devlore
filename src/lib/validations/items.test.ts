import { describe, expect, it } from "vitest";

import {
  createItemSchema,
  isCreatableTypeSlug,
  MARKDOWN_TYPE_SLUGS,
  parseTags,
  updateItemSchema,
} from "@/lib/validations/items";

describe("isCreatableTypeSlug", () => {
  it("accepts the types the New Item dialog can create", () => {
    const slugs = ["snippets", "prompts", "commands", "notes", "links", "files", "images"];
    for (const slug of slugs) {
      expect(isCreatableTypeSlug(slug)).toBe(true);
    }
  });

  it("rejects unknown slugs", () => {
    for (const slug of ["snippet", "image", ""]) {
      expect(isCreatableTypeSlug(slug)).toBe(false);
    }
  });
});

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

  it("rejects unknown types", () => {
    for (const type of ["widgets", "image", undefined]) {
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
      file: null,
    });
  });

  describe("file types", () => {
    const file = {
      key: "users/user-1/abc.png",
      fileName: "diagram.png",
      fileSize: 2048,
      mimeType: "image/png",
    };

    it("requires an uploaded file", () => {
      const result = createItemSchema.safeParse({ ...base, type: "images" });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]).toMatchObject({
        path: ["file"],
        message: "File is required",
      });
    });

    it("keeps the file and drops text fields", () => {
      const data = createItemSchema.parse({
        ...base,
        type: "images",
        content: "body",
        language: "ts",
        url: "https://react.dev",
        file,
      });

      expect(data).toMatchObject({ content: null, language: null, url: null, file });
    });

    it("rejects files that break the type's constraints", () => {
      for (const bad of [
        { ...file, fileName: "diagram.pdf" },
        { ...file, fileSize: 6 * 1024 * 1024 },
        { ...file, mimeType: "text/html" },
      ]) {
        expect(
          createItemSchema.safeParse({ ...base, type: "images", file: bad }).success,
        ).toBe(false);
      }
    });

    it("drops a file sent with a text type", () => {
      expect(createItemSchema.parse({ ...base, file }).file).toBeNull();
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
