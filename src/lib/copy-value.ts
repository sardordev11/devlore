import type { ContentType } from "@/generated/prisma/client";

interface CopyableItem {
  contentType: ContentType;
  content: string | null;
  url: string | null;
  fileUrl: string | null;
}

// What "Copy" puts on the clipboard for each content type.
export function getCopyValue(item: CopyableItem): string | null {
  if (item.contentType === "URL") return item.url;
  if (item.contentType === "FILE") return item.fileUrl;
  return item.content;
}
