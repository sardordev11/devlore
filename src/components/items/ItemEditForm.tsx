"use client";

import { CheckIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type SubmitEvent } from "react";
import { toast } from "sonner";

import { updateItem } from "@/actions/items";
import { ItemMetaSections } from "@/components/items/ItemDrawerDetails";
import { ItemFormFields } from "@/components/items/ItemFormFields";
import { Button } from "@/components/ui/button";
import { useItemFields } from "@/hooks/use-item-fields";
import { buildItemPayload } from "@/lib/item-form";
import { LANGUAGE_TYPE_SLUGS } from "@/lib/validations/items";
import type { ItemDetailJson } from "@/types/items";

interface ItemEditFormProps {
  item: ItemDetailJson;
  // Starts the Content field with this instead of the saved content (an
  // accepted AI rewrite); nothing changes until Save.
  initialContent?: string;
  onCancel: () => void;
  onSaved: (item: ItemDetailJson) => void;
}

export function ItemEditForm({
  item,
  initialContent,
  onCancel,
  onSaved,
}: ItemEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const itemFields = useItemFields(
    "item",
    {
      title: item.title,
      description: item.description ?? "",
      content: initialContent ?? item.content ?? "",
      language: item.language ?? "",
      url: item.url ?? "",
      tags: item.tags.join(", "),
    },
    isPending,
  );
  const { values, setFieldErrors } = itemFields;

  const [collectionIds, setCollectionIds] = useState(() =>
    item.collections.map((collection) => collection.id),
  );

  const fields = {
    content: item.contentType === "TEXT",
    language: LANGUAGE_TYPE_SLUGS.has(item.type.slug),
    url: item.contentType === "URL",
  };

  // Links need a URL, as when creating (a blank one would be saved as null)
  const canSave =
    Boolean(values.title.trim()) && (!fields.url || Boolean(values.url.trim()));

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) return;
    const payload = { ...buildItemPayload(values, fields), collectionIds };

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
        <Button type="submit" size="sm" disabled={isPending || !canSave}>
          <CheckIcon />
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>

      <div className="flex flex-col gap-6 p-6">
        <ItemFormFields
          idPrefix="item"
          typeSlug={item.type.slug}
          typeLabel={item.type.name}
          fields={fields}
          form={itemFields}
          collectionIds={collectionIds}
          onCollectionIdsChange={setCollectionIds}
          disabled={isPending}
          file={{ name: item.fileName, mimeType: item.mimeType }}
        />

        <ItemMetaSections item={item} showCollections={false} />
      </div>
    </form>
  );
}
