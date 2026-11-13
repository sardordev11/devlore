import { describe, expect, it } from "vitest";

import {
  appendTag,
  buildItemPayload,
  getNewTags,
  getTypeSlugFromPathname,
  type ItemFieldValues,
} from "@/lib/item-form";

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

describe("getNewTags", () => {
  it("drops suggestions already in the field, ignoring case", () => {
    expect(getNewTags("React, hooks", ["react", "typescript", "HOOKS", "state"])).toEqual([
      "typescript",
      "state",
    ]);
  });

  it("keeps everything for an empty field", () => {
    expect(getNewTags("", ["react"])).toEqual(["react"]);
  });
});

describe("appendTag", () => {
  it("appends to the comma-separated list and normalizes spacing", () => {
    expect(appendTag("react,hooks ,", "typescript")).toBe("react, hooks, typescript");
  });

  it("starts an empty field", () => {
    expect(appendTag("  ", "docker")).toBe("docker");
  });

  it("leaves the field unchanged for a duplicate", () => {
    expect(appendTag("React, hooks", "react")).toBe("React, hooks");
  });
});

describe("getTypeSlugFromPathname", () => {
  it("returns the type of an /items/[type] page", () => {
    expect(getTypeSlugFromPathname("/items/commands")).toBe("commands");
    expect(getTypeSlugFromPathname("/items/images/")).toBe("images");
  });

  it("returns null for other pages and unknown types", () => {
    expect(getTypeSlugFromPathname("/dashboard")).toBeNull();
    expect(getTypeSlugFromPathname("/items/unknown")).toBeNull();
    expect(getTypeSlugFromPathname("/items/snippets/extra")).toBeNull();
  });
});
