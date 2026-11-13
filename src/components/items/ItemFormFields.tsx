"use client";

import { CollectionPicker } from "@/components/items/CollectionPicker";
import { ContentField } from "@/components/items/ContentField";
import { DescriptionField } from "@/components/items/DescriptionField";
import { EditField } from "@/components/items/EditField";
import { LanguageSelect } from "@/components/items/LanguageSelect";
import { TagsField } from "@/components/items/TagsField";
import { Input } from "@/components/ui/input";
import { useAutoLanguage } from "@/hooks/use-detected-language";
import type { ItemFieldsState } from "@/hooks/use-item-fields";
import { getAutoLanguageLabel } from "@/lib/code-language";
import type { ItemFieldFlags } from "@/lib/item-form";

interface ItemFormFieldsProps {
  // Prefix for ids outside useItemFields, e.g. "new-item" → "new-item-collections".
  idPrefix: string;
  typeSlug: string;
  // Type name sent to the AI description, e.g. "Snippet".
  typeLabel?: string;
  fields: ItemFieldFlags;
  form: Pick<ItemFieldsState, "values" | "setValue" | "fieldErrors" | "fieldProps">;
  collectionIds: string[];
  onCollectionIdsChange: (collectionIds: string[]) => void;
  disabled: boolean;
  // The selected or saved file, described to the AI.
  file?: { name?: string | null; mimeType?: string | null };
  // Rendered after the title, e.g. the file upload when creating.
  afterTitle?: React.ReactNode;
}

// Item fields shared by the New Item dialog and the drawer's edit form.
// Rendered as siblings so each form keeps its own layout and spacing.
export function ItemFormFields({
  idPrefix,
  typeSlug,
  typeLabel,
  fields,
  form,
  collectionIds,
  onCollectionIdsChange,
  disabled,
  file,
  afterTitle,
}: ItemFormFieldsProps) {
  const { values, setValue, fieldErrors, fieldProps } = form;
  const { autoDetect, detectedLanguage } = useAutoLanguage(
    typeSlug,
    values.language,
    values.content,
  );
  const collectionsId = `${idPrefix}-collections`;

  return (
    <>
      <EditField id={fieldProps("title").id} label="Title" error={fieldErrors.title?.[0]}>
        <Input {...fieldProps("title")} required autoFocus />
      </EditField>

      {afterTitle}

      {fields.url && (
        <EditField id={fieldProps("url").id} label="URL" error={fieldErrors.url?.[0]}>
          <Input
            {...fieldProps("url")}
            type="url"
            required
            placeholder="https://example.com"
          />
        </EditField>
      )}

      <DescriptionField
        field={fieldProps("description")}
        error={fieldErrors.description?.[0]}
        onValueChange={(description) => setValue("description", description)}
        source={{
          title: values.title,
          type: typeLabel,
          content: fields.content ? values.content : "",
          language: fields.language ? values.language || (detectedLanguage ?? "") : "",
          url: fields.url ? values.url : "",
          fileName: file?.name ?? undefined,
          mimeType: file?.mimeType ?? undefined,
          tags: values.tags,
        }}
      />

      {fields.language && (
        <EditField
          id={fieldProps("language").id}
          label="Language"
          error={fieldErrors.language?.[0]}
        >
          <LanguageSelect
            field={fieldProps("language")}
            onValueChange={(language) => setValue("language", language)}
            noneLabel={autoDetect ? getAutoLanguageLabel(detectedLanguage) : undefined}
          />
        </EditField>
      )}

      {fields.content && (
        <EditField
          id={fieldProps("content").id}
          label="Content"
          error={fieldErrors.content?.[0]}
        >
          <ContentField
            // Remounts the editor when the New Item type changes
            key={typeSlug}
            typeSlug={typeSlug}
            field={fieldProps("content")}
            onValueChange={(content) => setValue("content", content)}
            language={values.language}
            detectedLanguage={detectedLanguage}
            invalid={Boolean(fieldErrors.content)}
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
        id={collectionsId}
        label="Collections"
        error={fieldErrors.collectionIds?.[0]}
      >
        <CollectionPicker
          id={collectionsId}
          value={collectionIds}
          onChange={onCollectionIdsChange}
          disabled={disabled}
          error={fieldErrors.collectionIds?.[0]}
        />
      </EditField>
    </>
  );
}
