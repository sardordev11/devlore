"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type SubmitEvent } from "react";
import { toast } from "sonner";

import { updateCollection } from "@/actions/collections";
import { EditField } from "@/components/items/EditField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  COLLECTION_DESCRIPTION_MAX,
  COLLECTION_NAME_MAX,
} from "@/lib/validations/collections";
import type { CollectionMeta } from "@/types/collections";

type FieldName = "name" | "description";
type FieldErrors = Partial<Record<FieldName, string[]>>;

interface EditCollectionDialogProps {
  collection: CollectionMeta;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function errorProps(id: string, error: string | undefined) {
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  };
}

// Controlled so it can be opened from a button or a dropdown menu item.
export function EditCollectionDialog({
  collection,
  open,
  onOpenChange,
}: EditCollectionDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) return;
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit collection</DialogTitle>
          <DialogDescription>Update the name and description.</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so the fields start from the current values. */}
        <EditCollectionForm
          collection={collection}
          isPending={isPending}
          startTransition={startTransition}
          onSaved={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

interface EditCollectionFormProps {
  collection: CollectionMeta;
  isPending: boolean;
  startTransition: (action: () => Promise<void>) => void;
  onSaved: () => void;
}

function EditCollectionForm({
  collection,
  isPending,
  startTransition,
  onSaved,
}: EditCollectionFormProps) {
  const router = useRouter();
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description ?? "");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const nameId = `edit-collection-${collection.id}-name`;
  const descriptionId = `edit-collection-${collection.id}-description`;
  const nameError = fieldErrors.name?.[0];
  const descriptionError = fieldErrors.description?.[0];

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await updateCollection(collection.id, { name, description });
      if (!result.success) {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error(result.error);
        return;
      }
      toast.success("Collection updated");
      onSaved();
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <EditField id={nameId} label="Name" error={nameError}>
        <Input
          id={nameId}
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={isPending}
          maxLength={COLLECTION_NAME_MAX}
          required
          autoFocus
          {...errorProps(nameId, nameError)}
        />
      </EditField>

      <EditField id={descriptionId} label="Description" error={descriptionError}>
        <Textarea
          id={descriptionId}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          disabled={isPending}
          maxLength={COLLECTION_DESCRIPTION_MAX}
          placeholder="Optional"
          rows={3}
          {...errorProps(descriptionId, descriptionError)}
        />
      </EditField>

      <DialogFooter>
        <DialogClose render={<Button variant="outline" />} disabled={isPending}>
          Cancel
        </DialogClose>
        <Button type="submit" disabled={isPending || !name.trim()}>
          {isPending ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}
