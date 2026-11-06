"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { deleteCollection } from "@/actions/collections";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) return;
    onOpenChange(nextOpen);
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCollection(collection.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      onOpenChange(false);
      toast.success("Collection deleted");
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this collection?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium break-words text-foreground">
              {collection.name}
            </span>{" "}
            will be permanently deleted. Its items won&apos;t be deleted, they
            just won&apos;t be in this collection anymore.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
