"use client";

import { CheckIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition, type SubmitEvent } from "react";
import { toast } from "sonner";

import { updateItem } from "@/actions/items";
import { ContentField } from "@/components/items/ContentField";
import { EditField } from "@/components/items/EditField";
import { ItemMetaSections } from "@/components/items/ItemDrawerDetails";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useItemFields } from "@/hooks/use-item-fields";
import { buildItemPayload } from "@/lib/item-form";
import { LANGUAGE_TYPE_SLUGS } from "@/lib/validations/items";
import type { ItemDetailJson } from "@/types/items";

interface ItemEditFormProps {
  item: ItemDetailJson;
  onCancel: () => void;
  onSaved: (item: ItemDetailJson) => void;
}

export function ItemEditForm({ item, onCancel, onSaved }: ItemEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { values, setValue, fieldErrors, setFieldErrors, fieldProps } =
    useItemFields(
      "item",
      {
        title: item.title,
        description: item.description ?? "",
        content: item.content ?? "",
        language: item.language ?? "",
        url: item.url ?? "",
        tags: item.tags.join(", "),
      },
      isPending,
    );

  const fields = {
    content: item.contentType === "TEXT",
    language: LANGUAGE_TYPE_SLUGS.has(item.type.slug),
    url: item.contentType === "URL",
  };

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = buildItemPayload(values, fields);

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

        {fields.content && (
          <EditField
            id="item-content"
            label="Content"
            error={fieldErrors.content?.[0]}
          >
            <ContentField
              typeSlug={item.type.slug}
              field={fieldProps("content")}
              onValueChange={(content) => setValue("content", content)}
              language={values.language}
              invalid={Boolean(fieldErrors.content)}
            />
          </EditField>
        )}

        {fields.language && (
          <EditField
            id="item-language"
            label="Language"
            error={fieldErrors.language?.[0]}
          >
            <Input {...fieldProps("language")} placeholder="typescript" />
          </EditField>
        )}

        {fields.url && (
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
