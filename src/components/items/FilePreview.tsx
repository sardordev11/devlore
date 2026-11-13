import { FileIcon } from "lucide-react";

import { formatFileSize, isImageMimeType } from "@/lib/file-constraints";
import type { ItemDetailJson } from "@/types/items";

interface FilePreviewProps {
  item: Pick<ItemDetailJson, "title" | "fileUrl" | "fileName" | "fileSize" | "mimeType">;
}

// Image preview (for images) plus a card with the file name, size and type.
export function FilePreview({ item }: FilePreviewProps) {
  const details = [
    item.fileSize !== null && formatFileSize(item.fileSize),
    item.mimeType,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-3">
      {item.fileUrl && isImageMimeType(item.mimeType) && (
        // Served from the public R2 domain, which next/image isn't configured for.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.fileUrl}
          alt={item.title}
          className="max-h-96 w-full rounded-lg border bg-muted/40 object-contain"
        />
      )}
      <div className="flex items-center gap-3 rounded-lg border p-3">
        <FileIcon className="size-8 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="break-all font-medium">{item.fileName}</p>
          {details.length > 0 && (
            <p className="text-xs text-muted-foreground">{details.join(" · ")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
