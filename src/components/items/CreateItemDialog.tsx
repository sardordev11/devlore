"use client";

import { usePathname } from "next/navigation";
import { Suspense, useState, type SubmitEvent } from "react";

import { usePlanAccess } from "@/components/billing/PlanAccessContext";
import {
  CreateItemTrigger,
  CreateItemTriggerFallback,
} from "@/components/items/CreateItemTrigger";
import { EditField } from "@/components/items/EditField";
import { FileUpload } from "@/components/items/FileUpload";
import { ItemFormFields } from "@/components/items/ItemFormFields";
import { TYPE_OPTIONS, TypeSelector } from "@/components/items/TypeSelector";
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
import { useCreateItem } from "@/hooks/use-create-item";
import { useItemFields } from "@/hooks/use-item-fields";
import { isFileTypeSlug } from "@/lib/file-constraints";
import {
  buildItemPayload,
  EMPTY_ITEM_FIELD_VALUES,
  getTypeSlugFromPathname,
} from "@/lib/item-form";
import { isProOnlyTypeSlug } from "@/lib/usage-limits";
import {
  getCreateFields,
  type CreatableTypeSlug,
} from "@/lib/validations/items";

interface CreateItemDialogProps {
  // Preselects this type and labels the trigger "New <Type>", e.g. on /items/snippets.
  defaultType?: CreatableTypeSlug;
}

// The plan streams in after the shell; until then the button waits disabled
export function CreateItemDialog({ defaultType }: CreateItemDialogProps) {
  return (
    <Suspense fallback={<CreateItemTriggerFallback defaultType={defaultType} />}>
      <CreateItemDialogContent defaultType={defaultType} />
    </Suspense>
  );
}

function CreateItemDialogContent({ defaultType }: CreateItemDialogProps) {
  const { proLocked } = usePlanAccess();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // The top bar's New Item follows the /items/[type] page it's opened from
  const initialType = defaultType ?? getTypeSlugFromPathname(pathname) ?? "snippets";
  const [type, setType] = useState<CreatableTypeSlug>(initialType);
  const typeLocked = proLocked && isProOnlyTypeSlug(type);
  const { submit, isPending, progress } = useCreateItem();
  const itemFields = useItemFields("new-item", EMPTY_ITEM_FIELD_VALUES, isPending);
  const { values, fieldErrors, setFieldErrors, reset: resetFields } = itemFields;
  const [file, setFile] = useState<File | null>(null);
  const [collectionIds, setCollectionIds] = useState<string[]>([]);

  const fields = getCreateFields(type);

  function reset() {
    setType(initialType);
    resetFields();
    setFile(null);
    setCollectionIds([]);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) return;
    // The shell stays mounted across navigations, so pick the type on open
    if (nextOpen) setType(initialType);
    setOpen(nextOpen);
    if (!nextOpen) reset();
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    submit(
      { type, fields: buildItemPayload(values, fields), collectionIds, file },
      {
        onFieldErrors: setFieldErrors,
        onSuccess: () => {
          setOpen(false);
          reset();
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <CreateItemTrigger defaultType={defaultType} />
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New item</DialogTitle>
          <DialogDescription>
            Choose a type, then fill in the details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="grid gap-4">
          <TypeSelector
            value={type}
            onChange={(slug) => {
              setType(slug);
              setFieldErrors({});
              setFile(null);
            }}
            disabled={isPending}
            proLocked={proLocked}
          />

          <ItemFormFields
            idPrefix="new-item"
            typeSlug={type}
            typeLabel={TYPE_OPTIONS.find((option) => option.slug === type)?.label}
            fields={fields}
            form={itemFields}
            collectionIds={collectionIds}
            onCollectionIdsChange={setCollectionIds}
            disabled={isPending}
            file={file ? { name: file.name, mimeType: file.type } : undefined}
            afterTitle={
              isFileTypeSlug(type) && (
                <EditField
                  id="new-item-file"
                  label={type === "images" ? "Image" : "File"}
                >
                  <FileUpload
                    key={type}
                    id="new-item-file"
                    type={type}
                    file={file}
                    onChange={(selected) => {
                      setFile(selected);
                      setFieldErrors((current) => ({ ...current, file: undefined }));
                    }}
                    progress={progress}
                    disabled={isPending}
                    error={fieldErrors.file?.[0]}
                  />
                </EditField>
              )
            }
          />

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />} disabled={isPending}>
              Cancel
            </DialogClose>
            <Button
              type="submit"
              disabled={
                isPending ||
                typeLocked ||
                !values.title.trim() ||
                (fields.url && !values.url.trim()) ||
                (fields.file && !file)
              }
            >
              {progress !== null ? "Uploading…" : isPending ? "Creating…" : "Create item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
