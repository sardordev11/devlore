import { describe, expect, it } from "vitest";

import {
  checkFile,
  formatFileSize,
  getAcceptAttribute,
  getFileExtension,
  isFileTypeSlug,
  isImageMimeType,
} from "@/lib/file-constraints";

const MB = 1024 * 1024;

describe("isFileTypeSlug", () => {
  it("accepts files and images only", () => {
    expect(isFileTypeSlug("files")).toBe(true);
    expect(isFileTypeSlug("images")).toBe(true);
    expect(isFileTypeSlug("snippets")).toBe(false);
    expect(isFileTypeSlug("image")).toBe(false);
  });
});

describe("getFileExtension", () => {
  it("returns the lowercased last extension", () => {
    expect(getFileExtension("Photo.JPG")).toBe(".jpg");
    expect(getFileExtension("archive.tar.json")).toBe(".json");
  });

  it("returns an empty string without an extension", () => {
    expect(getFileExtension("README")).toBe("");
    expect(getFileExtension(".env")).toBe("");
  });
});

describe("getAcceptAttribute", () => {
  it("lists the type's extensions", () => {
    expect(getAcceptAttribute("images")).toBe(
      ".png,.jpg,.jpeg,.gif,.webp,.svg",
    );
  });
});

describe("checkFile", () => {
  it("accepts an allowed image and returns its stored MIME type", () => {
    expect(
      checkFile({ name: "shot.jpeg", size: MB, type: "image/jpeg" }, "images"),
    ).toEqual({ ok: true, extension: ".jpeg", mimeType: "image/jpeg" });
  });

  it("takes the MIME type from the extension when the browser reports none", () => {
    expect(
      checkFile({ name: "config.toml", size: 10, type: "" }, "files"),
    ).toMatchObject({ ok: true, mimeType: "application/toml" });
    expect(
      checkFile(
        { name: "notes.md", size: 10, type: "application/octet-stream" },
        "files",
      ),
    ).toMatchObject({ ok: true, mimeType: "text/markdown" });
  });

  it("accepts the alternative YAML and XML MIME types", () => {
    expect(
      checkFile({ name: "a.yml", size: 10, type: "text/yaml" }, "files").ok,
    ).toBe(true);
    expect(
      checkFile({ name: "a.xml", size: 10, type: "text/xml" }, "files").ok,
    ).toBe(true);
  });

  it("rejects extensions the type doesn't allow", () => {
    expect(
      checkFile({ name: "doc.pdf", size: 10, type: "application/pdf" }, "images"),
    ).toMatchObject({ ok: false, error: expect.stringContaining("Unsupported") });
    expect(
      checkFile({ name: "page.html", size: 10, type: "text/html" }, "files").ok,
    ).toBe(false);
  });

  it("rejects a MIME type that doesn't match the extension", () => {
    expect(
      checkFile({ name: "evil.png", size: 10, type: "text/html" }, "images"),
    ).toEqual({ ok: false, error: "The file's type doesn't match its extension" });
  });

  it("enforces each type's max size", () => {
    expect(
      checkFile({ name: "a.png", size: 5 * MB, type: "image/png" }, "images").ok,
    ).toBe(true);
    expect(
      checkFile({ name: "a.png", size: 5 * MB + 1, type: "image/png" }, "images"),
    ).toEqual({ ok: false, error: "File is too large. Max size is 5 MB" });
    expect(
      checkFile({ name: "a.pdf", size: 10 * MB, type: "application/pdf" }, "files")
        .ok,
    ).toBe(true);
  });

  it("rejects empty files", () => {
    expect(
      checkFile({ name: "a.txt", size: 0, type: "text/plain" }, "files"),
    ).toEqual({ ok: false, error: "The file is empty" });
  });
});

describe("isImageMimeType", () => {
  it("detects image MIME types", () => {
    expect(isImageMimeType("image/svg+xml")).toBe(true);
    expect(isImageMimeType("application/pdf")).toBe(false);
    expect(isImageMimeType(null)).toBe(false);
  });
});

describe("formatFileSize", () => {
  it("formats bytes, kilobytes and megabytes", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1024)).toBe("1 KB");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(10 * MB)).toBe("10 MB");
    expect(formatFileSize(2.25 * MB)).toBe("2.3 MB");
  });
});
