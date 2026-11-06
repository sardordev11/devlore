import { describe, expect, it } from "vitest";

import { getContentPreview } from "@/lib/search";

const EMPTY = { content: null, url: null, fileName: null };

describe("getContentPreview", () => {
  it("collapses whitespace in text content", () => {
    expect(
      getContentPreview({
        ...EMPTY,
        contentType: "TEXT",
        content: "  docker compose\n\n  up -d\t--build ",
      }),
    ).toBe("docker compose up -d --build");
  });

  it("uses the URL for links and the file name for files", () => {
    expect(
      getContentPreview({ ...EMPTY, contentType: "URL", url: "https://a.dev" }),
    ).toBe("https://a.dev");
    expect(
      getContentPreview({ ...EMPTY, contentType: "FILE", fileName: "notes.pdf" }),
    ).toBe("notes.pdf");
  });

  it("returns null when there is nothing to show", () => {
    expect(getContentPreview({ ...EMPTY, contentType: "TEXT" })).toBeNull();
    expect(
      getContentPreview({ ...EMPTY, contentType: "TEXT", content: " \n " }),
    ).toBeNull();
  });

  it("keeps text that is exactly at the limit", () => {
    expect(
      getContentPreview({ ...EMPTY, contentType: "TEXT", content: "0123456789" }, 10),
    ).toBe("0123456789");
  });

  it("truncates long text with an ellipsis within the limit", () => {
    const preview = getContentPreview(
      { ...EMPTY, contentType: "TEXT", content: "a ".repeat(50) },
      10,
    );
    expect(preview).toBe("a a a a a…");
    expect(preview!.length).toBeLessThanOrEqual(10);
  });
});
