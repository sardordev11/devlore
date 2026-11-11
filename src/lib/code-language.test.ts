import { describe, expect, it } from "vitest";

import {
  getAutoLanguageLabel,
  getFallbackLanguage,
  shouldDetectLanguage,
  getLanguageOptions,
  getLanguageSelectValue,
  LANGUAGE_OPTIONS,
  NO_LANGUAGE_OPTION,
  toMonacoLanguage,
} from "@/lib/code-language";

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

describe("getLanguageSelectValue", () => {
  it("normalizes aliases to the option value", () => {
    expect(getLanguageSelectValue("bash")).toBe("shell");
    expect(getLanguageSelectValue(" TS ")).toBe("typescript");
  });

  it("returns null when the language is blank", () => {
    expect(getLanguageSelectValue("")).toBeNull();
    expect(getLanguageSelectValue("  ")).toBeNull();
    expect(getLanguageSelectValue(null)).toBeNull();
  });
});

describe("getLanguageOptions", () => {
  it("starts with None and lists every known language", () => {
    const options = getLanguageOptions("");
    expect(options[0]).toEqual(NO_LANGUAGE_OPTION);
    expect(options).toHaveLength(LANGUAGE_OPTIONS.length + 1);
  });

  it("doesn't add an extra option for known languages or aliases", () => {
    expect(getLanguageOptions("typescript")).toHaveLength(
      LANGUAGE_OPTIONS.length + 1,
    );
    expect(getLanguageOptions("bash")).toHaveLength(LANGUAGE_OPTIONS.length + 1);
  });

  it("keeps an unknown stored language as an extra option", () => {
    const options = getLanguageOptions(" Elixir ");
    expect(options.at(-1)).toEqual({ value: "elixir", label: "Elixir" });
  });

  it("renames the empty option when given a label", () => {
    expect(getLanguageOptions("", "Auto (Go)")[0]).toEqual({
      value: null,
      label: "Auto (Go)",
    });
  });

  it("has unique option values", () => {
    const values = getLanguageOptions("").map((option) => option.value);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("shouldDetectLanguage", () => {
  it("detects only for snippets without a language", () => {
    expect(shouldDetectLanguage("snippets", "")).toBe(true);
    expect(shouldDetectLanguage("snippets", "  ")).toBe(true);
    expect(shouldDetectLanguage("snippets", null)).toBe(true);
    expect(shouldDetectLanguage("snippets", "python")).toBe(false);
    expect(shouldDetectLanguage("commands", "")).toBe(false);
  });
});

describe("getAutoLanguageLabel", () => {
  it("names the detected language", () => {
    expect(getAutoLanguageLabel("typescript")).toBe("Auto (TypeScript)");
    expect(getAutoLanguageLabel("shell")).toBe("Auto (Shell)");
  });

  it("reads just Auto when nothing was detected", () => {
    expect(getAutoLanguageLabel(null)).toBe("Auto");
  });
});
