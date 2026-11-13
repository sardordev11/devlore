"use client";

import { useRouter } from "next/navigation";

import { deleteCollection } from "@/actions/collections";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import type { CollectionMeta } from "@/types/collections";

interface DeleteCollectionDialogProps {
  collection: Pick<CollectionMeta, "id" | "name">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Where to go after deleting, e.g. away from the deleted collection's page.
  redirectTo?: string;
}

// Controlled so it can be opened from a button or a dropdown menu item.
export function DeleteCollectionDialog({
  collection,
  open,
  onOpenChange,
  redirectTo,
}: DeleteCollectionDialogProps) {
  const router = useRouter();

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete this collection?"
      description={
        <>
          <span className="font-medium break-words text-foreground">
            {collection.name}
          </span>{" "}
          will be permanently deleted. Its items won&apos;t be deleted, they
          just won&apos;t be in this collection anymore.
        </>
      }
      confirmLabel="Delete"
      pendingLabel="Deleting…"
      onConfirm={() => deleteCollection(collection.id)}
      successMessage="Collection deleted"
      onSuccess={() => {
        if (redirectTo) router.push(redirectTo);
        router.refresh();
      }}
    />
  );
}
