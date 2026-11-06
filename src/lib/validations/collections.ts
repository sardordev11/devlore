import { z } from "zod";

export const COLLECTION_NAME_MAX = 100;
export const COLLECTION_DESCRIPTION_MAX = 500;

export const collectionIdSchema = z.string().min(1).max(100);

// Name and description, shared by create and edit.
const collectionFieldsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(COLLECTION_NAME_MAX, `Name must be at most ${COLLECTION_NAME_MAX} characters`),
  // Blank descriptions are stored as null.
  description: z
    .string()
    .trim()
    .max(
      COLLECTION_DESCRIPTION_MAX,
      `Description must be at most ${COLLECTION_DESCRIPTION_MAX} characters`,
    )
    .nullish()
    .transform((value) => (value ? value : null)),
});

export const createCollectionSchema = collectionFieldsSchema;
export const updateCollectionSchema = collectionFieldsSchema;

export type CreateCollectionInput = z.output<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.output<typeof updateCollectionSchema>;
