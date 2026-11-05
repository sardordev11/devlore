"use server";

import { z } from "zod";

import { auth } from "@/auth";
import {
  createCollection as createCollectionQuery,
  getCollectionOptions as getCollectionOptionsQuery,
  type CollectionOption,
  type CreatedCollection,
} from "@/lib/db/collections";
import { createCollectionSchema } from "@/lib/validations/collections";

type CreateCollectionResult =
  | { success: true; data: CreatedCollection }
  | {
      success: false;
      error: string;
      fieldErrors?: Partial<
        Record<keyof z.input<typeof createCollectionSchema>, string[]>
      >;
    };

type CollectionOptionsResult =
  | { success: true; data: CollectionOption[] }
  | { success: false; error: string };

// The signed-in user's collections, for the item form's collection picker.
export async function getCollectionOptions(): Promise<CollectionOptionsResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in" };
  }

  try {
    const collections = await getCollectionOptionsQuery(session.user.id);
    return { success: true, data: collections };
  } catch (error) {
    console.error("Load collections failed:", error);
    return { success: false, error: "Couldn't load your collections" };
  }
}

export async function createCollection(
  data: unknown,
): Promise<CreateCollectionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in" };
  }

  const parsed = createCollectionSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid collection",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    const collection = await createCollectionQuery(session.user.id, parsed.data);
    return { success: true, data: collection };
  } catch (error) {
    console.error("Create collection failed:", error);
    return {
      success: false,
      error: "Couldn't create the collection. Please try again.",
    };
  }
}
