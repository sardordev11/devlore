"use client";

import { MoreHorizontalIcon, PencilIcon, StarIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { DeleteCollectionDialog } from "@/components/collections/DeleteCollectionDialog";
import { EditCollectionDialog } from "@/components/collections/EditCollectionDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFavoriteToggle } from "@/hooks/use-favorite-toggle";
import { TOUCH_ICON_BUTTON } from "@/lib/touch-target";
import { cn } from "@/lib/utils";
import type { CollectionMeta } from "@/types/collections";

interface CollectionActionsMenuProps {
  collection: CollectionMeta;
  className?: string;
}

// 3-dots menu on a CollectionCard with Edit, Delete and Favorite.
export function CollectionActionsMenu({
  collection,
  className,
}: CollectionActionsMenuProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { isFavorite, toggle } = useFavoriteToggle({
    target: "collection",
    id: collection.id,
    isFavorite: collection.isFavorite,
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${collection.name}`}
              className={cn(TOUCH_ICON_BUTTON, className)}
            />
          }
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <PencilIcon />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void toggle()}>
            <StarIcon
              className={cn(isFavorite && "fill-yellow-400 text-yellow-400")}
            />
            {isFavorite ? "Unfavorite" : "Favorite"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditCollectionDialog
        collection={collection}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteCollectionDialog
        collection={collection}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
