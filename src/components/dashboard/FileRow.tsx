import { PinIcon, StarIcon } from "lucide-react";
import { createElement } from "react";

import { FileDownloadButton } from "@/components/items/FileDownloadButton";
import { ItemDrawerTrigger } from "@/components/items/ItemDrawerTrigger";
import type { ItemSummary } from "@/lib/db/items";
import { formatFileSize } from "@/lib/file-constraints";
import { getFileIcon } from "@/lib/file-icons";

// UTC keeps the server-rendered date stable regardless of the server's time zone.
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

interface FileRowProps {
  item: ItemSummary;
}

export function FileRow({ item }: FileRowProps) {
  const { type } = item;
  const size = item.fileSize !== null ? formatFileSize(item.fileSize) : "—";

  return (
    <ItemDrawerTrigger itemId={item.id}>
      <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-muted/40">
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-lg"
          // 1a = ~10% alpha on the hex type color.
          style={{ backgroundColor: `${type.color}1a`, color: type.color }}
        >
          {createElement(getFileIcon(item.fileName), { className: "size-4.5" })}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5 md:flex-row md:items-center md:gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate font-medium">{item.title}</h3>
              {item.isPinned && (
                <PinIcon className="size-3.5 shrink-0 text-muted-foreground" />
              )}
              {item.isFavorite && (
                <StarIcon className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
              )}
            </div>
            {item.fileName && item.fileName !== item.title && (
              <p className="truncate text-xs text-muted-foreground">
                {item.fileName}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground md:contents">
            <span className="md:w-20 md:shrink-0 md:text-right">{size}</span>
            <span aria-hidden className="md:hidden">
              ·
            </span>
            <time
              dateTime={item.createdAt.toISOString()}
              className="md:w-28 md:shrink-0 md:text-right"
            >
              {DATE_FORMAT.format(item.createdAt)}
            </time>
          </div>
        </div>

        {item.fileName ? (
          <FileDownloadButton itemId={item.id} fileName={item.fileName} />
        ) : (
          // Keeps the size and date columns aligned with rows that have a button.
          <div className="size-8 shrink-0" />
        )}
      </div>
    </ItemDrawerTrigger>
  );
}
