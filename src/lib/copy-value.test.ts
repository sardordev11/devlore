import { describe, expect, it } from "vitest";

import { getCopyValue } from "@/lib/copy-value";

const ITEM = {
  content: "npm run dev",
  url: "https://example.com",
  fileUrl: "https://files.example.com/users/user-1/abc.pdf",
};

describe("getCopyValue", () => {
  it("copies the content for text items", () => {
    expect(getCopyValue({ ...ITEM, contentType: "TEXT" })).toBe("npm run dev");
  });

  it("copies the URL for link items", () => {
    expect(getCopyValue({ ...ITEM, contentType: "URL" })).toBe(
      "https://example.com",
    );
  });

  it("copies the file URL for file items", () => {
    expect(getCopyValue({ ...ITEM, contentType: "FILE" })).toBe(
      "https://files.example.com/users/user-1/abc.pdf",
    );
  });

  it("returns null when there's nothing to copy", () => {
    expect(
      getCopyValue({ ...ITEM, contentType: "TEXT", content: null }),
    ).toBeNull();
  });
});
