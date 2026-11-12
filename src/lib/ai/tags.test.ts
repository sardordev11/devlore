import { describe, expect, it } from "vitest";

import {
  AI_TAG_CONTENT_MAX,
  buildTagInput,
  generateAutoTagsSchema,
  parseTagResponse,
} from "@/lib/ai/tags";

describe("generateAutoTagsSchema", () => {
  it("requires a title", () => {
    const result = generateAutoTagsSchema.safeParse({ title: "  ", content: "x" });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Add a title first");
  });

  it("trims and truncates content to the limit", () => {
    const result = generateAutoTagsSchema.parse({
      title: " useDebounce ",
      content: `  ${"a".repeat(AI_TAG_CONTENT_MAX + 500)}`,
    });

    expect(result.title).toBe("useDebounce");
    expect(result.content).toHaveLength(AI_TAG_CONTENT_MAX);
  });

  it("treats missing content as empty", () => {
    expect(generateAutoTagsSchema.parse({ title: "Docs" }).content).toBe("");
    expect(generateAutoTagsSchema.parse({ title: "Docs", content: null }).content).toBe("");
  });
});

describe("buildTagInput", () => {
  it("asks for JSON and wraps the item in delimiters", () => {
    const input = buildTagInput({ title: "Hook", content: "const x = 1;" });

    expect(input).toBe(
      "Suggest tags for this item as JSON.\n<item>\nTitle: Hook\nContent:\nconst x = 1;\n</item>",
    );
    // OpenAI rejects json_object output unless the input mentions JSON
    expect(input.toLowerCase()).toContain("json");
  });

  it("marks empty content", () => {
    expect(buildTagInput({ title: "Hook", content: "" })).toContain("Content: (none)");
  });
});

describe("parseTagResponse", () => {
  it("reads an object with a tags array", () => {
    expect(parseTagResponse('{"tags": ["react", "hooks", "typescript"]}')).toEqual([
      "react",
      "hooks",
      "typescript",
    ]);
  });

  it("reads a bare array", () => {
    expect(parseTagResponse('["docker", "devops"]')).toEqual(["docker", "devops"]);
  });

  it("lowercases, trims, removes commas and dedupes", () => {
    expect(
      parseTagResponse('{"tags": [" React ", "react", "Next.js", "a,b", "Node   JS"]}'),
    ).toEqual(["react", "next.js", "ab", "node js"]);
  });

  it("drops non-strings, blanks and overlong tags, and caps at 5", () => {
    expect(
      parseTagResponse(
        JSON.stringify({ tags: [1, "", "  ", "x".repeat(51), "a", "b", "c", "d", "e", "f"] }),
      ),
    ).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("returns an empty list for invalid or unexpected JSON", () => {
    expect(parseTagResponse("")).toEqual([]);
    expect(parseTagResponse("not json")).toEqual([]);
    expect(parseTagResponse('{"labels": ["react"]}')).toEqual([]);
    expect(parseTagResponse('{"tags": "react"}')).toEqual([]);
    expect(parseTagResponse("null")).toEqual([]);
  });
});
