"use client";

import { PencilIcon, StarIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { DeleteCollectionDialog } from "@/components/collections/DeleteCollectionDialog";
import { EditCollectionDialog } from "@/components/collections/EditCollectionDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CollectionMeta } from "@/types/collections";

interface CollectionActionsProps {
  collection: CollectionMeta;
}

// Favorite, Edit and Delete buttons for the /collections/[id] header.
export function CollectionActions({ collection }: CollectionActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex shrink-0 items-center gap-1">
      {/* Display only until favoriting collections is implemented. */}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={collection.isFavorite ? "Unfavorite" : "Favorite"}
        aria-pressed={collection.isFavorite}
      >
        <StarIcon
          className={cn(collection.isFavorite && "fill-yellow-400 text-yellow-400")}
        />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Edit collection"
        onClick={() => setEditOpen(true)}
      >
        <PencilIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Delete collection"
        className="text-destructive hover:text-destructive"
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2Icon />
      </Button>

      <EditCollectionDialog
        collection={collection}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteCollectionDialog
        collection={collection}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        redirectTo="/collections"
      />
    </div>
  );
}
