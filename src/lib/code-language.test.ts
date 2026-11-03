import { describe, expect, it } from "vitest";

import { getFallbackLanguage, toMonacoLanguage } from "@/lib/code-language";

describe("getFallbackLanguage", () => {
  it("uses shell for commands and plaintext otherwise", () => {
    expect(getFallbackLanguage("commands")).toBe("shell");
    expect(getFallbackLanguage("snippets")).toBe("plaintext");
  });
});

describe("toMonacoLanguage", () => {
  it("maps aliases and extensions to Monaco ids", () => {
    expect(toMonacoLanguage("ts")).toBe("typescript");
    expect(toMonacoLanguage("bash")).toBe("shell");
    expect(toMonacoLanguage("yml")).toBe("yaml");
    expect(toMonacoLanguage("py")).toBe("python");
  });

  it("trims and lowercases before matching", () => {
    expect(toMonacoLanguage("  TSX ")).toBe("typescript");
    expect(toMonacoLanguage("TypeScript")).toBe("typescript");
  });

  it("passes through names that are already Monaco ids", () => {
    expect(toMonacoLanguage("dockerfile")).toBe("dockerfile");
    expect(toMonacoLanguage("rust")).toBe("rust");
  });

  it("uses the fallback when the language is blank", () => {
    expect(toMonacoLanguage(null)).toBe("plaintext");
    expect(toMonacoLanguage("   ")).toBe("plaintext");
    expect(toMonacoLanguage(undefined, "shell")).toBe("shell");
  });
});
