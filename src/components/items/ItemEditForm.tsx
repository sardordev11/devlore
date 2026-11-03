"use client";

import { CheckIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type SubmitEvent } from "react";
import { toast } from "sonner";

import { updateItem } from "@/actions/items";
import { ItemMetaSections } from "@/components/items/ItemDrawerDetails";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LANGUAGE_TYPE_SLUGS, parseTags } from "@/lib/validations/items";
import type { ItemDetailJson } from "@/types/items";

type FieldName = "title" | "description" | "content" | "language" | "url" | "tags";

interface ItemEditFormProps {
  item: ItemDetailJson;
  onCancel: () => void;
  onSaved: (item: ItemDetailJson) => void;
}

interface EditFieldProps {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}

export function EditField({ id, label, error, children }: EditFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function ItemEditForm({ item, onCancel, onSaved }: ItemEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldName, string[]>>
  >({});
  const [values, setValues] = useState({
    title: item.title,
    description: item.description ?? "",
    content: item.content ?? "",
    language: item.language ?? "",
    url: item.url ?? "",
    tags: item.tags.join(", "),
  });

  const showContent = item.contentType === "TEXT";
  const showLanguage = LANGUAGE_TYPE_SLUGS.has(item.type.slug);
  const showUrl = item.contentType === "URL";

  function setValue(name: FieldName, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function fieldProps(name: FieldName) {
    const error = fieldErrors[name]?.[0];
    return {
      id: `item-${name}`,
      value: values[name],
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setValue(name, event.target.value),
      disabled: isPending,
      "aria-invalid": error ? true : undefined,
      "aria-describedby": error ? `item-${name}-error` : undefined,
    };
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    // Fields that aren't shown for this type are omitted, so they stay unchanged.
    const payload = {
      title: values.title,
      description: values.description,
      tags: parseTags(values.tags),
      ...(showContent && { content: values.content }),
      ...(showLanguage && { language: values.language }),
      ...(showUrl && { url: values.url }),
    };

    startTransition(async () => {
      const result = await updateItem(item.id, payload);
      if (!result.success) {
        setFieldErrors("fieldErrors" in result ? result.fieldErrors : {});
        toast.error(result.error);
        return;
      }
      toast.success("Item saved");
      onSaved(result.data);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex flex-wrap items-center justify-end gap-1 border-b px-6 pb-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isPending}
        >
          <XIcon />
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isPending || !values.title.trim()}
        >
          <CheckIcon />
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>

      <div className="flex flex-col gap-6 p-6">
        <EditField id="item-title" label="Title" error={fieldErrors.title?.[0]}>
          <Input {...fieldProps("title")} required autoFocus />
        </EditField>

        <EditField
          id="item-description"
          label="Description"
          error={fieldErrors.description?.[0]}
        >
          <Textarea {...fieldProps("description")} rows={2} />
        </EditField>

        {showContent && (
          <EditField
            id="item-content"
            label="Content"
            error={fieldErrors.content?.[0]}
          >
            <Textarea
              {...fieldProps("content")}
              rows={10}
              className="max-h-96 font-mono text-xs leading-relaxed md:text-xs"
            />
          </EditField>
        )}

        {showLanguage && (
          <EditField
            id="item-language"
            label="Language"
            error={fieldErrors.language?.[0]}
          >
            <Input {...fieldProps("language")} placeholder="typescript" />
          </EditField>
        )}

        {showUrl && (
          <EditField id="item-url" label="URL" error={fieldErrors.url?.[0]}>
            <Input
              {...fieldProps("url")}
              type="url"
              placeholder="https://example.com"
            />
          </EditField>
        )}

        <EditField id="item-tags" label="Tags" error={fieldErrors.tags?.[0]}>
          <Input {...fieldProps("tags")} placeholder="react, hooks, auth" />
        </EditField>

        <ItemMetaSections item={item} />
      </div>
    </form>
  );
}
