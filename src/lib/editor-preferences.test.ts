import { describe, expect, it } from "vitest";

import {
  DEFAULT_EDITOR_PREFERENCES,
  editorPreferencesSchema,
  parseEditorPreferences,
} from "@/lib/editor-preferences";

const custom = {
  fontSize: 16,
  tabSize: 4,
  wordWrap: false,
  minimap: true,
  theme: "monokai",
} as const;

describe("DEFAULT_EDITOR_PREFERENCES", () => {
  it("turns word wrap on, the minimap off and uses vs-dark", () => {
    expect(DEFAULT_EDITOR_PREFERENCES).toMatchObject({
      wordWrap: true,
      minimap: false,
      theme: "vs-dark",
    });
  });

  it("passes the strict schema", () => {
    expect(editorPreferencesSchema.safeParse(DEFAULT_EDITOR_PREFERENCES).success).toBe(
      true,
    );
  });
});

describe("editorPreferencesSchema", () => {
  it("accepts a complete set of valid preferences", () => {
    expect(editorPreferencesSchema.parse(custom)).toEqual(custom);
  });

  it.each([
    ["an unlisted font size", { fontSize: 17 }],
    ["a font size as a string", { fontSize: "16" }],
    ["an unlisted tab size", { tabSize: 3 }],
    ["a non-boolean word wrap", { wordWrap: "on" }],
    ["a non-boolean minimap", { minimap: 1 }],
    ["an unknown theme", { theme: "solarized" }],
  ])("rejects %s", (_, override) => {
    expect(editorPreferencesSchema.safeParse({ ...custom, ...override }).success).toBe(
      false,
    );
  });

  it("rejects missing fields", () => {
    expect(
      editorPreferencesSchema.safeParse({ ...custom, theme: undefined }).success,
    ).toBe(false);
  });
});

describe("parseEditorPreferences", () => {
  it.each([
    ["null", null],
    ["undefined", undefined],
    ["a string", "vs-dark"],
    ["an array", [1, 2]],
  ])("falls back to the defaults for %s", (_, value) => {
    expect(parseEditorPreferences(value)).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("keeps valid stored preferences", () => {
    expect(parseEditorPreferences(custom)).toEqual(custom);
  });

  it("fills missing fields with defaults", () => {
    expect(parseEditorPreferences({ theme: "github-dark" })).toEqual({
      ...DEFAULT_EDITOR_PREFERENCES,
      theme: "github-dark",
    });
  });

  it("replaces only the invalid fields with defaults", () => {
    expect(parseEditorPreferences({ ...custom, fontSize: 99, theme: "nope" })).toEqual({
      ...custom,
      fontSize: DEFAULT_EDITOR_PREFERENCES.fontSize,
      theme: DEFAULT_EDITOR_PREFERENCES.theme,
    });
  });

  it("drops unknown keys", () => {
    expect(parseEditorPreferences({ ...custom, extra: true })).toEqual(custom);
  });
});
