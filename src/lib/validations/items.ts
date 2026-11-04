import { z } from "zod";

import { checkFile, isFileTypeSlug } from "@/lib/file-constraints";

// Blank strings are stored as null. Omitted fields (undefined) are left unchanged.
const blankToNull = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value));

const optionalText = blankToNull.nullish();

export const itemIdSchema = z.string().min(1).max(100);

// System types that can be created from the New Item dialog.
export const CREATABLE_TYPE_SLUGS = [
  "snippets",
  "prompts",
  "commands",
  "notes",
  "links",
  "files",
  "images",
] as const;

export type CreatableTypeSlug = (typeof CREATABLE_TYPE_SLUGS)[number];

export function isCreatableTypeSlug(slug: string): slug is CreatableTypeSlug {
  return (CREATABLE_TYPE_SLUGS as readonly string[]).includes(slug);
}

// Types with a code-highlighting language.
export const LANGUAGE_TYPE_SLUGS: ReadonlySet<string> = new Set([
  "snippets",
  "commands",
]);

// Types whose content is edited and shown as Markdown.
export const MARKDOWN_TYPE_SLUGS: ReadonlySet<string> = new Set([
  "notes",
  "prompts",
]);

// Which optional fields a creatable type uses.
export function getCreateFields(slug: CreatableTypeSlug) {
  const file = isFileTypeSlug(slug);
  return {
    content: slug !== "links" && !file,
    language: LANGUAGE_TYPE_SLUGS.has(slug),
    url: slug === "links",
    file,
  };
}

const titleField = z.string().trim().min(1, "Title is required").max(200);

// Only http(s), since the drawer renders the URL as a link.
const urlField = blankToNull
  .pipe(
    z
      .url({ protocol: /^https?$/, message: "Enter a valid http(s) URL" })
      .nullable(),
  )
  .nullish();

const tagsField = z
  .array(z.string().trim().min(1, "Tags can't be empty").max(50))
  // Duplicate names would collide on the per-user unique tag name.
  .transform((tags) => [...new Set(tags)]);

export const updateItemSchema = z.object({
  title: titleField,
  description: optionalText,
  content: optionalText,
  language: optionalText,
  url: urlField,
  tags: tagsField,
});

export type UpdateItemInput = z.output<typeof updateItemSchema>;

// The uploaded file as returned by POST /api/upload.
const fileField = z
  .object({
    key: z.string().min(1).max(300),
    fileName: z.string().trim().min(1).max(255),
    fileSize: z.number().int().positive(),
    mimeType: z.string().max(100),
  })
  .nullish();

export const createItemSchema = z
  .object({
    type: z.enum(CREATABLE_TYPE_SLUGS, "Choose an item type"),
    title: titleField,
    description: optionalText,
    content: optionalText,
    language: optionalText,
    url: urlField,
    tags: tagsField,
    file: fileField,
  })
  .superRefine((data, ctx) => {
    if (data.type === "links" && !data.url) {
      ctx.addIssue({ code: "custom", path: ["url"], message: "URL is required" });
    }
    if (!isFileTypeSlug(data.type)) return;
    if (!data.file) {
      ctx.addIssue({ code: "custom", path: ["file"], message: "File is required" });
      return;
    }
    const { fileName: name, fileSize: size, mimeType: type } = data.file;
    const check = checkFile({ name, size, type }, data.type);
    if (!check.ok) {
      ctx.addIssue({ code: "custom", path: ["file"], message: check.error });
    }
  })
  // Fields the type doesn't use are dropped, so a link never stores content.
  .transform(({ content, language, url, file, ...data }) => {
    const fields = getCreateFields(data.type);
    return {
      ...data,
      content: fields.content ? (content ?? null) : null,
      language: fields.language ? (language ?? null) : null,
      url: fields.url ? (url ?? null) : null,
      file: fields.file ? (file ?? null) : null,
    };
  });

export type CreateItemInput = z.output<typeof createItemSchema>;

// "react, hooks, , react" -> ["react", "hooks", "react"]; the schema dedupes.
export function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
