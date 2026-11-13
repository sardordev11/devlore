"use client";

import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";

import { deleteItem } from "@/actions/items";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface DeleteItemDialogProps {
  itemId: string;
  itemTitle: string;
  onDeleted: () => void;
}

export function DeleteItemDialog({
  itemId,
  itemTitle,
  onDeleted,
}: DeleteItemDialogProps) {
  const router = useRouter();

  return (
    <ConfirmDialog
      trigger={
        <AlertDialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Delete item"
              className="text-destructive hover:text-destructive"
            />
          }
        >
          <Trash2Icon />
        </AlertDialogTrigger>
      }
      title="Delete this item?"
      description={
        <>
          <span className="font-medium break-words text-foreground">
            {itemTitle}
          </span>{" "}
          will be permanently deleted and removed from all collections. This
          can&apos;t be undone.
        </>
      }
      confirmLabel="Delete"
      pendingLabel="Deleting…"
      onConfirm={() => deleteItem(itemId)}
      successMessage="Item deleted"
      onSuccess={() => {
        onDeleted();
        router.refresh();
      }}
    />
  );
}
