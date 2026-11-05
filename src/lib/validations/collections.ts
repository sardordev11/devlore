import { z } from "zod";

export const COLLECTION_NAME_MAX = 100;
export const COLLECTION_DESCRIPTION_MAX = 500;

export const createCollectionSchema = z.object({
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

export type CreateCollectionInput = z.output<typeof createCollectionSchema>;
