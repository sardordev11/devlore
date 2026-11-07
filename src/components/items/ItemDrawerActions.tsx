"use client";

import { CopyIcon, DownloadIcon, PencilIcon } from "lucide-react";
import { toast } from "sonner";

import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { DeleteItemDialog } from "@/components/items/DeleteItemDialog";
import { PinButton } from "@/components/items/PinButton";
import { Button } from "@/components/ui/button";
import { getCopyValue } from "@/lib/copy-value";
import type { ItemDetailJson } from "@/types/items";

interface ItemDrawerActionsProps {
  item: ItemDetailJson;
  onEdit: () => void;
  onDeleted: () => void;
  onUpdated: (item: ItemDetailJson) => void;
}

export function ItemDrawerActions({
  item,
  onEdit,
  onDeleted,
  onUpdated,
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
      <FavoriteButton
        target="item"
        id={item.id}
        isFavorite={item.isFavorite}
        variant="label"
        onChange={(isFavorite) => onUpdated({ ...item, isFavorite })}
      />
      <PinButton
        id={item.id}
        isPinned={item.isPinned}
        onChange={(isPinned) => onUpdated({ ...item, isPinned })}
      />
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
