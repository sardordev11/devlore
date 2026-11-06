"use server";

import { z } from "zod";

import { auth } from "@/auth";
import {
  createCollection as createCollectionQuery,
  deleteCollection as deleteCollectionQuery,
  getCollectionOptions as getCollectionOptionsQuery,
  updateCollection as updateCollectionQuery,
  type CollectionOption,
  type CreatedCollection,
} from "@/lib/db/collections";
import {
  collectionIdSchema,
  createCollectionSchema,
  updateCollectionSchema,
} from "@/lib/validations/collections";

const NOT_FOUND = "Collection not found";

type CreateCollectionResult =
  | { success: true; data: CreatedCollection }
  | {
      success: false;
      error: string;
      fieldErrors?: Partial<
        Record<keyof z.input<typeof createCollectionSchema>, string[]>
      >;
    };

type UpdateCollectionResult =
  | { success: true; data: CreatedCollection }
  | {
      success: false;
      error: string;
      fieldErrors?: Partial<
        Record<keyof z.input<typeof updateCollectionSchema>, string[]>
      >;
    };

type DeleteCollectionResult =
  | { success: true; data: { id: string } }
  | { success: false; error: string };

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

export async function updateCollection(
  collectionId: unknown,
  data: unknown,
): Promise<UpdateCollectionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in" };
  }

  const id = collectionIdSchema.safeParse(collectionId);
  if (!id.success) return { success: false, error: NOT_FOUND };

  const parsed = updateCollectionSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid collection",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    const collection = await updateCollectionQuery(
      session.user.id,
      id.data,
      parsed.data,
    );
    if (!collection) return { success: false, error: NOT_FOUND };
    return { success: true, data: collection };
  } catch (error) {
    console.error("Update collection failed:", error);
    return {
      success: false,
      error: "Couldn't update the collection. Please try again.",
    };
  }
}

// Removes the collection only; its items are kept.
export async function deleteCollection(
  collectionId: unknown,
): Promise<DeleteCollectionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in" };
  }

  const id = collectionIdSchema.safeParse(collectionId);
  if (!id.success) return { success: false, error: NOT_FOUND };

  try {
    const deleted = await deleteCollectionQuery(session.user.id, id.data);
    if (!deleted) return { success: false, error: NOT_FOUND };
    return { success: true, data: deleted };
  } catch (error) {
    console.error("Delete collection failed:", error);
    return {
      success: false,
      error: "Couldn't delete the collection. Please try again.",
    };
  }
}
