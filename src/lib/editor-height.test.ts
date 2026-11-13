import { describe, expect, it } from "vitest";

import {
  clampEditorHeight,
  EDITOR_MAX_HEIGHT,
  EDITOR_MIN_HEIGHT,
  estimateEditorHeight,
  getLineHeight,
} from "@/lib/editor-height";

describe("getLineHeight", () => {
  it("scales with the font size, rounded", () => {
    expect(getLineHeight(13)).toBe(19);
    expect(getLineHeight(16)).toBe(23);
    expect(getLineHeight(20)).toBe(29);
  });
});

describe("clampEditorHeight", () => {
  it("keeps heights within the bounds", () => {
    expect(clampEditorHeight(10)).toBe(EDITOR_MIN_HEIGHT);
    expect(clampEditorHeight(200)).toBe(200);
    expect(clampEditorHeight(5000)).toBe(EDITOR_MAX_HEIGHT);
  });
});

describe("estimateEditorHeight", () => {
  it("uses the line count plus padding", () => {
    expect(estimateEditorHeight("a\nb\nc\nd\ne", 19)).toBe(5 * 19 + 24);
  });

  it("never goes below the minimum for short content", () => {
    expect(estimateEditorHeight("", 19)).toBe(EDITOR_MIN_HEIGHT);
  });

  it("caps long content at the maximum", () => {
    expect(estimateEditorHeight("x\n".repeat(100), 19)).toBe(EDITOR_MAX_HEIGHT);
  });
});
