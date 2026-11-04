import { parseTags } from "@/lib/validations/items";

export type ItemFieldName =
  | "title"
  | "description"
  | "content"
  | "language"
  | "url"
  | "tags";

export type ItemFieldValues = Record<ItemFieldName, string>;

export const EMPTY_ITEM_FIELD_VALUES: ItemFieldValues = {
  title: "",
  description: "",
  content: "",
  language: "",
  url: "",
  tags: "",
};

// Which optional fields the item's type shows.
export interface ItemFieldFlags {
  content: boolean;
  language: boolean;
  url: boolean;
}

// Fields the type doesn't show are omitted, so an update leaves them unchanged.
export function buildItemPayload(values: ItemFieldValues, fields: ItemFieldFlags) {
  return {
    title: values.title,
    description: values.description,
    tags: parseTags(values.tags),
    ...(fields.content && { content: values.content }),
    ...(fields.language && { language: values.language }),
    ...(fields.url && { url: values.url }),
  };
}
