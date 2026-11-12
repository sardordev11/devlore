import { describe, expect, it } from "vitest";

import {
  AI_EXPLAIN_CONTENT_MAX,
  buildExplainInput,
  canExplainType,
  explainCodeSchema,
  parseExplainResponse,
} from "@/lib/ai/explain";

describe("canExplainType", () => {
  it("allows snippets and commands only", () => {
    expect(canExplainType("snippets")).toBe(true);
    expect(canExplainType("commands")).toBe(true);
    expect(canExplainType("prompts")).toBe(false);
    expect(canExplainType("notes")).toBe(false);
    expect(canExplainType("links")).toBe(false);
  });
});

describe("explainCodeSchema", () => {
  it("requires an item id", () => {
    expect(explainCodeSchema.safeParse({ itemId: "" }).success).toBe(false);
    expect(explainCodeSchema.safeParse({}).success).toBe(false);
  });

  it("trims the language and defaults it to blank", () => {
    expect(explainCodeSchema.parse({ itemId: "item-1", language: " ts " })).toEqual({
      itemId: "item-1",
      language: "ts",
    });
    expect(explainCodeSchema.parse({ itemId: "item-1", language: null }).language).toBe("");
    expect(explainCodeSchema.parse({ itemId: "item-1" }).language).toBe("");
  });
});

describe("buildExplainInput", () => {
  it("wraps a snippet in item tags with its language", () => {
    const input = buildExplainInput({
      title: "useDebounce",
      typeSlug: "snippets",
      content: "export function useDebounce() {}",
      language: "typescript",
    });

    expect(input).toBe(
      [
        "Explain this code snippet.",
        "<item>",
        "Title: useDebounce",
        "Language: typescript",
        "Content:\nexport function useDebounce() {}",
        "</item>",
      ].join("\n"),
    );
  });

  it("calls commands terminal commands and skips a blank language", () => {
    const input = buildExplainInput({
      title: "Compose up",
      typeSlug: "commands",
      content: "docker compose up -d",
      language: "",
    });

    expect(input).toContain("Explain this terminal command.");
    expect(input).not.toContain("Language:");
  });

  it("caps long content", () => {
    const input = buildExplainInput({
      title: "Long",
      typeSlug: "snippets",
      content: "x".repeat(AI_EXPLAIN_CONTENT_MAX + 500),
      language: "",
    });

    expect(input).toContain("x".repeat(AI_EXPLAIN_CONTENT_MAX));
    expect(input).not.toContain("x".repeat(AI_EXPLAIN_CONTENT_MAX + 1));
  });
});

describe("parseExplainResponse", () => {
  it("trims the text", () => {
    expect(parseExplainResponse("  Runs the **server**.\n")).toBe("Runs the **server**.");
  });

  it("drops a wrapping markdown fence", () => {
    expect(parseExplainResponse("```markdown\n- `-d` detaches\n```")).toBe("- `-d` detaches");
    expect(parseExplainResponse("```md\nPlain text\n```")).toBe("Plain text");
  });

  it("keeps code blocks inside the explanation", () => {
    const text = "Runs it:\n```bash\nnpm run dev\n```\nThen opens the app.";
    expect(parseExplainResponse(text)).toBe(text);
    const codeOnly = "```bash\nnpm i\n```";
    expect(parseExplainResponse(codeOnly)).toBe(codeOnly);
  });

  it("returns an empty string for blank output", () => {
    expect(parseExplainResponse("   ")).toBe("");
  });
});
