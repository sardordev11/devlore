"use client";

import {
  CopyIcon,
  DownloadIcon,
  PencilIcon,
  PinIcon,
  StarIcon,
} from "lucide-react";
import { toast } from "sonner";

import { DeleteItemDialog } from "@/components/items/DeleteItemDialog";
import { Button } from "@/components/ui/button";
import { getCopyValue } from "@/lib/copy-value";
import { cn } from "@/lib/utils";
import type { ItemDetailJson } from "@/types/items";

interface ItemDrawerActionsProps {
  item: ItemDetailJson;
  onEdit: () => void;
  onDeleted: () => void;
}

// Favorite and Pin are display only until their features land.
export function ItemDrawerActions({
  item,
  onEdit,
  onDeleted,
}: ItemDrawerActionsProps) {
  const copyValue = getCopyValue(item);

  async function handleCopy() {
    if (!copyValue) return;
    try {
      await navigator.clipboard.writeText(copyValue);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b px-6 pb-4">
      <Button
        variant="ghost"
        size="sm"
        aria-pressed={item.isFavorite}
        className={cn(
          item.isFavorite && "text-yellow-400 hover:text-yellow-400",
        )}
      >
        <StarIcon className={cn(item.isFavorite && "fill-yellow-400")} />
        Favorite
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-pressed={item.isPinned}
        className={cn(!item.isPinned && "text-muted-foreground")}
      >
        <PinIcon className={cn(item.isPinned && "fill-current")} />
        Pin
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        disabled={!copyValue}
      >
        <CopyIcon />
        Copy
      </Button>
      {item.contentType === "FILE" && item.fileName && (
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<a href={`/api/items/${item.id}/download`} download />}
        >
          <DownloadIcon />
          Download
        </Button>
      )}

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <PencilIcon />
          Edit
        </Button>
        <DeleteItemDialog
          itemId={item.id}
          itemTitle={item.title}
          onDeleted={onDeleted}
        />
      </div>
    </div>
  );
}
