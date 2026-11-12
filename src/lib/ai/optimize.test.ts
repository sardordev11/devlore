import { describe, expect, it } from "vitest";

import {
  AI_OPTIMIZE_CHANGES_MAX,
  buildOptimizeInput,
  canOptimizeType,
  optimizePromptSchema,
  parseOptimizeResponse,
} from "@/lib/ai/optimize";

const ORIGINAL = "Review my code.";
const SOURCE = { title: "Code review", content: ORIGINAL };

describe("canOptimizeType", () => {
  it("allows prompts only", () => {
    expect(canOptimizeType("prompts")).toBe(true);
    expect(canOptimizeType("snippets")).toBe(false);
    expect(canOptimizeType("notes")).toBe(false);
  });
});

describe("optimizePromptSchema", () => {
  it("requires an item id", () => {
    expect(optimizePromptSchema.safeParse({ itemId: "" }).success).toBe(false);
    expect(optimizePromptSchema.safeParse({}).success).toBe(false);
    expect(optimizePromptSchema.parse({ itemId: "item-1" })).toEqual({ itemId: "item-1" });
  });
});

describe("buildOptimizeInput", () => {
  it("wraps the prompt in item tags and mentions JSON", () => {
    expect(buildOptimizeInput({ title: "Code review", content: ORIGINAL })).toBe(
      [
        "Review this prompt and return the result as JSON.",
        "<item>",
        "Title: Code review",
        "Prompt:\nReview my code.",
        "</item>",
      ].join("\n"),
    );
  });
});

describe("parseOptimizeResponse", () => {
  it("returns the trimmed rewrite and its changes", () => {
    const text = JSON.stringify({
      improved: true,
      optimized: "  Review my TypeScript code for bugs.\n",
      changes: [" Named the  language ", "Stated the goal", "Stated the goal", 3, ""],
    });

    expect(parseOptimizeResponse(text, SOURCE)).toEqual({
      improved: true,
      optimized: "Review my TypeScript code for bugs.",
      changes: ["Named the language", "Stated the goal"],
    });
  });

  it("caps the list of changes", () => {
    const changes = Array.from({ length: 10 }, (_, index) => `Change ${index}`);
    const result = parseOptimizeResponse(
      JSON.stringify({ improved: true, optimized: "Better", changes }),
      SOURCE,
    );

    expect(result).toMatchObject({ improved: true });
    expect(result?.improved && result.changes).toHaveLength(AI_OPTIMIZE_CHANGES_MAX);
  });

  it("allows a rewrite without a changes list", () => {
    expect(parseOptimizeResponse('{"optimized": "Better"}', SOURCE)).toEqual({
      improved: true,
      optimized: "Better",
      changes: [],
    });
  });

  it("treats improved false as already good", () => {
    expect(
      parseOptimizeResponse('{"improved": false, "optimized": "", "changes": []}', SOURCE),
    ).toEqual({ improved: false });
  });

  it("treats a rewrite that only differs in whitespace as already good", () => {
    const text = JSON.stringify({ improved: true, optimized: "Review   my\ncode. " });
    expect(parseOptimizeResponse(text, SOURCE)).toEqual({ improved: false });
  });

  it("strips an echoed input wrapper", () => {
    const text = JSON.stringify({
      improved: true,
      optimized: "<item>\nTitle: Code review\nPrompt:\nReview my code for bugs.\n</item>",
    });
    expect(parseOptimizeResponse(text, SOURCE)).toMatchObject({
      improved: true,
      optimized: "Review my code for bugs.",
    });

    const inline = JSON.stringify({
      improved: true,
      optimized: "<item> Title: Code review Prompt: Review my code for bugs.",
    });
    expect(parseOptimizeResponse(inline, SOURCE)).toMatchObject({
      optimized: "Review my code for bugs.",
    });
  });

  it("keeps labels that aren't the input wrapper", () => {
    const optimized = "Title: Bug report\nList the steps to reproduce.";
    const text = JSON.stringify({ improved: true, optimized });
    expect(parseOptimizeResponse(text, SOURCE)).toMatchObject({ optimized });
  });

  it("returns null for unusable output", () => {
    expect(parseOptimizeResponse("not json", SOURCE)).toBeNull();
    expect(parseOptimizeResponse("null", SOURCE)).toBeNull();
    expect(parseOptimizeResponse('{"improved": true, "optimized": "  "}', SOURCE)).toBeNull();
    expect(parseOptimizeResponse('{"improved": true, "optimized": 5}', SOURCE)).toBeNull();
  });
});
