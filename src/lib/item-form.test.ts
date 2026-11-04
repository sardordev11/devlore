import { describe, expect, it } from "vitest";

import { buildItemPayload, type ItemFieldValues } from "@/lib/item-form";

const VALUES: ItemFieldValues = {
  title: "useAuth Hook",
  description: "Custom hook",
  content: "export function useAuth() {}",
  language: "typescript",
  url: "https://example.com",
  tags: "react, hooks, react",
};

describe("buildItemPayload", () => {
  it("always includes the title, description and parsed tags", () => {
    expect(
      buildItemPayload(VALUES, { content: false, language: false, url: false }),
    ).toEqual({
      title: "useAuth Hook",
      description: "Custom hook",
      tags: ["react", "hooks", "react"],
    });
  });

  it("includes only the optional fields the type shows", () => {
    expect(
      buildItemPayload(VALUES, { content: true, language: true, url: false }),
    ).toEqual({
      title: "useAuth Hook",
      description: "Custom hook",
      tags: ["react", "hooks", "react"],
      content: "export function useAuth() {}",
      language: "typescript",
    });
  });

  it("keeps blank shown fields so they can be cleared", () => {
    const payload = buildItemPayload(
      { ...VALUES, url: "" },
      { content: false, language: false, url: true },
    );
    expect(payload).toHaveProperty("url", "");
  });
});
