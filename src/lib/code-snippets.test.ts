import { describe, expect, it } from "vitest";

import { JS_SNIPPETS, toSnippetPreview } from "@/lib/code-snippets";

describe("JS_SNIPPETS", () => {
  it("has unique prefixes", () => {
    const prefixes = JS_SNIPPETS.map((snippet) => snippet.prefix);
    expect(new Set(prefixes).size).toBe(prefixes.length);
  });

  it("expands log to console.log", () => {
    const log = JS_SNIPPETS.find((snippet) => snippet.prefix === "log");
    expect(log?.body).toBe("console.log($1);");
  });

  it("uses lowercase single-word prefixes, like VS Code", () => {
    for (const snippet of JS_SNIPPETS) {
      expect(snippet.prefix).toMatch(/^[a-z]+$/);
    }
  });
});

describe("toSnippetPreview", () => {
  it("replaces placeholders with their default text", () => {
    expect(toSnippetPreview("function ${1:name}(${2:params}) {\n\t$0\n}")).toBe(
      "function name(params) {\n\t\n}",
    );
  });

  it("drops bare tab stops", () => {
    expect(toSnippetPreview("console.log($1);")).toBe("console.log();");
  });
});
