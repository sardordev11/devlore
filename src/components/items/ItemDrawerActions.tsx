"use client";

import {
  CopyIcon,
  PencilIcon,
  PinIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ItemDetailJson } from "@/types/items";

interface ItemDrawerActionsProps {
  item: ItemDetailJson;
}

// What "Copy" puts on the clipboard for each content type.
function getCopyValue(item: ItemDetailJson): string | null {
  if (item.contentType === "URL") return item.url;
  if (item.contentType === "FILE") return item.fileUrl;
  return item.content;
}

// Favorite, Pin, Edit and Delete are display only until their features land.
export function ItemDrawerActions({ item }: ItemDrawerActionsProps) {
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

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="sm">
          <PencilIcon />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Delete item"
          className="text-destructive hover:text-destructive"
        >
          <Trash2Icon />
        </Button>
      </div>
    </div>
  );
}
