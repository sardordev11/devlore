"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type SubmitEvent } from "react";
import { toast } from "sonner";

import { createItem } from "@/actions/items";
import { ContentField } from "@/components/items/ContentField";
import { EditField } from "@/components/items/EditField";
import { FileUpload } from "@/components/items/FileUpload";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useItemFields } from "@/hooks/use-item-fields";
import { isFileTypeSlug } from "@/lib/file-constraints";
import { buildItemPayload, EMPTY_ITEM_FIELD_VALUES } from "@/lib/item-form";
import { cn } from "@/lib/utils";
import {
  getCreateFields,
  type CreatableTypeSlug,
} from "@/lib/validations/items";

interface CreateItemDialogProps {
  // Preselects this type and labels the trigger "New <Type>", e.g. on /items/snippets.
  defaultType?: CreatableTypeSlug;
}

export function CreateItemDialog({ defaultType }: CreateItemDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const initialType = defaultType ?? "snippets";
  const [type, setType] = useState<CreatableTypeSlug>(initialType);
  const triggerLabel = defaultType
    ? `New ${TYPE_OPTIONS.find((option) => option.slug === defaultType)?.label}`
    : "New Item";
  const { values, setValue, fieldErrors, setFieldErrors, fieldProps, reset: resetFields } =
    useItemFields("new-item", EMPTY_ITEM_FIELD_VALUES, isPending);
  const [file, setFile] = useState<File | null>(null);
  const { upload, progress } = useFileUpload();

  const fields = getCreateFields(type);

  function reset() {
    setType(initialType);
    resetFields();
    setFile(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) return;
    setOpen(nextOpen);
    if (!nextOpen) reset();
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = { type, ...buildItemPayload(values, fields) };

    startTransition(async () => {
      // Files go to R2 first; the item then references the stored key.
      let uploaded = null;
      if (isFileTypeSlug(type)) {
        if (!file) return;
        const uploadResult = await upload(file, type);
        if (!uploadResult.success) {
          setFieldErrors({ file: [uploadResult.error] });
          toast.error(uploadResult.error);
          return;
        }
        uploaded = uploadResult.data;
      }

      const result = await createItem({ ...payload, file: uploaded });
      if (!result.success) {
        setFieldErrors("fieldErrors" in result ? result.fieldErrors : {});
        toast.error(result.error);
        return;
      }
      toast.success("Item created");
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button aria-label={triggerLabel} />}>
        <Plus data-icon="inline-start" />
        {/* The top bar is tight on mobile, so only the type pages always show the label. */}
        <span className={cn(!defaultType && "hidden sm:inline")}>{triggerLabel}</span>
      </DialogTrigger>
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
          />

          <EditField id="new-item-title" label="Title" error={fieldErrors.title?.[0]}>
            <Input {...fieldProps("title")} required autoFocus />
          </EditField>

          {isFileTypeSlug(type) && (
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
          )}

          {fields.url && (
            <EditField id="new-item-url" label="URL" error={fieldErrors.url?.[0]}>
              <Input
                {...fieldProps("url")}
                type="url"
                required
                placeholder="https://example.com"
              />
            </EditField>
          )}

          <EditField
            id="new-item-description"
            label="Description"
            error={fieldErrors.description?.[0]}
          >
            <Textarea {...fieldProps("description")} rows={2} />
          </EditField>

          {fields.content && (
            <EditField
              id="new-item-content"
              label="Content"
              error={fieldErrors.content?.[0]}
            >
              <ContentField
                key={type}
                typeSlug={type}
                field={fieldProps("content")}
                onValueChange={(content) => setValue("content", content)}
                language={values.language}
                invalid={Boolean(fieldErrors.content)}
              />
            </EditField>
          )}

          {fields.language && (
            <EditField
              id="new-item-language"
              label="Language"
              error={fieldErrors.language?.[0]}
            >
              <Input {...fieldProps("language")} placeholder="typescript" />
            </EditField>
          )}

          <EditField id="new-item-tags" label="Tags" error={fieldErrors.tags?.[0]}>
            <Input {...fieldProps("tags")} placeholder="react, hooks, auth" />
          </EditField>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />} disabled={isPending}>
              Cancel
            </DialogClose>
            <Button
              type="submit"
              disabled={
                isPending ||
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
