import type { ContentType } from "@/generated/prisma/client";

export const SEARCH_PREVIEW_MAX = 120;

interface PreviewSource {
  contentType: ContentType;
  content: string | null;
  url: string | null;
  fileName: string | null;
}

// Short single-line text shown under an item in the command palette and matched by search.
export function getContentPreview(
  { contentType, content, url, fileName }: PreviewSource,
  max = SEARCH_PREVIEW_MAX,
): string | null {
  const source =
    contentType === "URL" ? url : contentType === "FILE" ? fileName : content;
  const text = source?.replace(/\s+/g, " ").trim();
  if (!text) return null;

  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}
