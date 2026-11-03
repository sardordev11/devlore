import { z } from "zod";

// Blank strings are stored as null. Omitted fields (undefined) are left unchanged.
const blankToNull = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value));

const optionalText = blankToNull.nullish();

export const updateItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: optionalText,
  content: optionalText,
  language: optionalText,
  // Only http(s), since the drawer renders the URL as a link.
  url: blankToNull
    .pipe(
      z
        .url({ protocol: /^https?$/, message: "Enter a valid http(s) URL" })
        .nullable(),
    )
    .nullish(),
  tags: z
    .array(z.string().trim().min(1, "Tags can't be empty").max(50))
    // Duplicate names would collide on the per-user unique tag name.
    .transform((tags) => [...new Set(tags)]),
});

export type UpdateItemInput = z.output<typeof updateItemSchema>;

// "react, hooks, , react" -> ["react", "hooks", "react"]; the schema dedupes.
export function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
