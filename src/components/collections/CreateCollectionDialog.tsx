"use client";

import { FolderPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type SubmitEvent } from "react";
import { toast } from "sonner";

import { createCollection } from "@/actions/collections";
import { toastUpgradeError } from "@/components/billing/UpgradePrompt";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  COLLECTION_DESCRIPTION_MAX,
  COLLECTION_NAME_MAX,
} from "@/lib/validations/collections";

type FieldName = "name" | "description";
type FieldErrors = Partial<Record<FieldName, string[]>>;

const NAME_ID = "new-collection-name";
const DESCRIPTION_ID = "new-collection-description";

function errorProps(id: string, error: string | undefined) {
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  };
}

export function CreateCollectionDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function reset() {
    setName("");
    setDescription("");
    setFieldErrors({});
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) return;
    setOpen(nextOpen);
    if (!nextOpen) reset();
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await createCollection({ name, description });
      if (!result.success) {
        if ("upgrade" in result) {
          toastUpgradeError(result.error);
          return;
        }
        setFieldErrors(result.fieldErrors ?? {});
        toast.error(result.error);
        return;
      }
      toast.success("Collection created");
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  const nameError = fieldErrors.name?.[0];
  const descriptionError = fieldErrors.description?.[0];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            aria-label="New Collection"
            title="New Collection"
            className="pointer-coarse:h-10"
          />
        }
      >
        <FolderPlus data-icon="inline-start" />
        <span className="hidden lg:inline">New Collection</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New collection</DialogTitle>
          <DialogDescription>
            Group related items of any type in one place.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="grid gap-4">
          <EditField id={NAME_ID} label="Name" error={nameError}>
            <Input
              id={NAME_ID}
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isPending}
              maxLength={COLLECTION_NAME_MAX}
              placeholder="React Patterns"
              required
              autoFocus
              {...errorProps(NAME_ID, nameError)}
            />
          </EditField>

          <EditField id={DESCRIPTION_ID} label="Description" error={descriptionError}>
            <Textarea
              id={DESCRIPTION_ID}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={isPending}
              maxLength={COLLECTION_DESCRIPTION_MAX}
              placeholder="Optional"
              rows={3}
              {...errorProps(DESCRIPTION_ID, descriptionError)}
            />
          </EditField>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />} disabled={isPending}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? "Creating…" : "Create collection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
