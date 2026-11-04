import { CodeIcon, FileQuestionIcon } from "lucide-react";
import { describe, expect, it } from "vitest";

import { getTypeIcon, getTypeTint } from "@/lib/type-icons";

describe("getTypeIcon", () => {
  it("maps a stored icon name to its component", () => {
    expect(getTypeIcon("Code")).toBe(CodeIcon);
  });

  it("falls back for unknown names", () => {
    expect(getTypeIcon("Nope")).toBe(FileQuestionIcon);
  });
});

describe("getTypeTint", () => {
  it("uses the color as text and a ~10% alpha background", () => {
    expect(getTypeTint("#3b82f6")).toEqual({
      backgroundColor: "#3b82f61a",
      color: "#3b82f6",
    });
  });
});
