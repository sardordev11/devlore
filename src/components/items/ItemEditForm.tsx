"use client";

import { CheckIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type SubmitEvent } from "react";
import { toast } from "sonner";

import { updateItem } from "@/actions/items";
import { CollectionPicker } from "@/components/items/CollectionPicker";
import { ContentField } from "@/components/items/ContentField";
import { DescriptionField } from "@/components/items/DescriptionField";
import { LanguageSelect } from "@/components/items/LanguageSelect";
import { EditField } from "@/components/items/EditField";
import { ItemMetaSections } from "@/components/items/ItemDrawerDetails";
import { TagsField } from "@/components/items/TagsField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDetectedLanguage } from "@/hooks/use-detected-language";
import { useItemFields } from "@/hooks/use-item-fields";
import {
  getAutoLanguageLabel,
  shouldDetectLanguage,
} from "@/lib/code-language";
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
  const { values, setValue, fieldErrors, setFieldErrors, fieldProps } =
    useItemFields(
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

  const [collectionIds, setCollectionIds] = useState(() =>
    item.collections.map((collection) => collection.id),
  );

  const fields = {
    content: item.contentType === "TEXT",
    language: LANGUAGE_TYPE_SLUGS.has(item.type.slug),
    url: item.contentType === "URL",
  };

  const autoDetect = shouldDetectLanguage(item.type.slug, values.language);
  const detectedLanguage = useDetectedLanguage(values.content, autoDetect);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
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

        <DescriptionField
          field={fieldProps("description")}
          error={fieldErrors.description?.[0]}
          onValueChange={(description) => setValue("description", description)}
          source={{
            title: values.title,
            type: item.type.name,
            content: fields.content ? values.content : "",
            language: fields.language ? values.language || (detectedLanguage ?? "") : "",
            url: fields.url ? values.url : "",
            fileName: item.fileName ?? "",
            mimeType: item.mimeType ?? "",
            tags: values.tags,
          }}
        />

        {fields.language && (
          <EditField
            id="item-language"
            label="Language"
            error={fieldErrors.language?.[0]}
          >
            <LanguageSelect
              field={fieldProps("language")}
              onValueChange={(language) => setValue("language", language)}
              noneLabel={
                autoDetect ? getAutoLanguageLabel(detectedLanguage) : undefined
              }
            />
          </EditField>
        )}

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
              detectedLanguage={detectedLanguage}
              invalid={Boolean(fieldErrors.content)}
            />
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

        <TagsField
          field={fieldProps("tags")}
          error={fieldErrors.tags?.[0]}
          onValueChange={(tags) => setValue("tags", tags)}
          title={values.title}
          content={fields.url ? values.url : fields.content ? values.content : ""}
        />

        <EditField
          id="item-collections"
          label="Collections"
          error={fieldErrors.collectionIds?.[0]}
        >
          <CollectionPicker
            id="item-collections"
            value={collectionIds}
            onChange={setCollectionIds}
            disabled={isPending}
            error={fieldErrors.collectionIds?.[0]}
          />
        </EditField>

        <ItemMetaSections item={item} showCollections={false} />
      </div>
    </form>
  );
}
