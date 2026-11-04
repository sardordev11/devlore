// Upload rules for the File and Image types, shared by the client and the server.

export const FILE_TYPE_SLUGS = ["files", "images"] as const;

export type FileTypeSlug = (typeof FILE_TYPE_SLUGS)[number];

export function isFileTypeSlug(slug: string): slug is FileTypeSlug {
  return (FILE_TYPE_SLUGS as readonly string[]).includes(slug);
}

const MB = 1024 * 1024;

interface FileConstraint {
  maxSize: number;
  // Extension -> MIME type stored with the file.
  extensions: Record<string, string>;
  // MIME types a browser may report for these extensions.
  mimeTypes: ReadonlySet<string>;
}

export const FILE_CONSTRAINTS: Record<FileTypeSlug, FileConstraint> = {
  images: {
    maxSize: 5 * MB,
    extensions: {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
    },
    mimeTypes: new Set([
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ]),
  },
  files: {
    maxSize: 10 * MB,
    extensions: {
      ".pdf": "application/pdf",
      ".txt": "text/plain",
      ".md": "text/markdown",
      ".json": "application/json",
      ".yaml": "application/x-yaml",
      ".yml": "application/x-yaml",
      ".xml": "application/xml",
      ".csv": "text/csv",
      ".toml": "application/toml",
      ".ini": "text/plain",
    },
    mimeTypes: new Set([
      "application/pdf",
      "text/plain",
      "text/markdown",
      "application/json",
      "application/x-yaml",
      "text/yaml",
      "application/xml",
      "text/xml",
      "text/csv",
      "application/toml",
    ]),
  },
};

// Browsers report no type (or a generic one) for extensions they don't know, e.g. .toml or .md.
const UNKNOWN_MIME_TYPES: ReadonlySet<string> = new Set([
  "",
  "application/octet-stream",
]);

export function getFileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(dot).toLowerCase() : "";
}

export function getAcceptAttribute(slug: FileTypeSlug): string {
  return Object.keys(FILE_CONSTRAINTS[slug].extensions).join(",");
}

export interface FileLike {
  name: string;
  size: number;
  type: string;
}

export type FileCheck =
  | { ok: true; extension: string; mimeType: string }
  | { ok: false; error: string };

// The extension decides the stored MIME type; the browser's type only has to agree with it.
export function checkFile(file: FileLike, slug: FileTypeSlug): FileCheck {
  const constraint = FILE_CONSTRAINTS[slug];
  const extension = getFileExtension(file.name);
  const mimeType = constraint.extensions[extension];

  if (!mimeType) {
    const allowed = Object.keys(constraint.extensions).join(", ");
    return { ok: false, error: `Unsupported file type. Allowed: ${allowed}` };
  }
  if (!UNKNOWN_MIME_TYPES.has(file.type) && !constraint.mimeTypes.has(file.type)) {
    return { ok: false, error: "The file's type doesn't match its extension" };
  }
  if (file.size === 0) {
    return { ok: false, error: "The file is empty" };
  }
  if (file.size > constraint.maxSize) {
    return {
      ok: false,
      error: `File is too large. Max size is ${formatFileSize(constraint.maxSize)}`,
    };
  }
  return { ok: true, extension, mimeType };
}

export function isImageMimeType(mimeType: string | null): boolean {
  return Boolean(mimeType?.startsWith("image/"));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${(bytes / 1024).toFixed(1).replace(/\.0$/, "")} KB`;
  return `${(bytes / MB).toFixed(1).replace(/\.0$/, "")} MB`;
}
