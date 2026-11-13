import {
  isCreatableTypeSlug,
  parseTags,
  type CreatableTypeSlug,
} from "@/lib/validations/items";

// "/items/commands" → "commands", so the top bar's New Item matches the page
export function getTypeSlugFromPathname(pathname: string): CreatableTypeSlug | null {
  const match = /^\/items\/([^/]+)\/?$/.exec(pathname);
  return match && isCreatableTypeSlug(match[1]) ? match[1] : null;
}

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

function hasTag(tagsValue: string, tag: string) {
  const lower = tag.toLowerCase();
  return parseTags(tagsValue).some((existing) => existing.toLowerCase() === lower);
}

// Suggested tags that aren't already in the comma-separated tags field.
export function getNewTags(tagsValue: string, suggestions: string[]) {
  return suggestions.filter((tag) => !hasTag(tagsValue, tag));
}

// Appends a tag to the comma-separated tags field, skipping duplicates.
export function appendTag(tagsValue: string, tag: string) {
  if (hasTag(tagsValue, tag)) return tagsValue;
  return [...parseTags(tagsValue), tag].join(", ");
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
