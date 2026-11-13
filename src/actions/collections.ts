"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import {
  COLLECTION_NOT_FOUND,
  getSessionUserId,
  SIGNED_OUT_ERROR,
  toValidationFailure,
} from "@/lib/action-helpers";
import {
  createCollection as createCollectionQuery,
  deleteCollection as deleteCollectionQuery,
  getCollectionOptions as getCollectionOptionsQuery,
  setCollectionFavorite,
  updateCollection as updateCollectionQuery,
  type CollectionOption,
  type CreatedCollection,
} from "@/lib/db/collections";
import { checkCollectionLimit } from "@/lib/plan-gate";
import {
  collectionIdSchema,
  createCollectionSchema,
  updateCollectionSchema,
} from "@/lib/validations/collections";
import type { ActionResult, FieldErrors } from "@/types/actions";
import type { FavoriteResult } from "@/types/favorites";

type CreateCollectionResult =
  | { success: true; data: CreatedCollection }
  // upgrade: the free collection limit was hit, so the client offers the upgrade link
  | { success: false; error: string; upgrade: true }
  | {
      success: false;
      error: string;
      fieldErrors?: FieldErrors<typeof createCollectionSchema>;
    };

type UpdateCollectionResult =
  | { success: true; data: CreatedCollection }
  | {
      success: false;
      error: string;
      fieldErrors?: FieldErrors<typeof updateCollectionSchema>;
    };

type DeleteCollectionResult = ActionResult<{ id: string }>;

type CollectionOptionsResult = ActionResult<CollectionOption[]>;

// The signed-in user's collections, for the item form's collection picker.
export async function getCollectionOptions(): Promise<CollectionOptionsResult> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: SIGNED_OUT_ERROR };

  try {
    const collections = await getCollectionOptionsQuery(userId);
    return { success: true, data: collections };
  } catch (error) {
    console.error("Load collections failed:", error);
    return { success: false, error: "Couldn't load your collections" };
  }
}

export async function createCollection(
  data: unknown,
): Promise<CreateCollectionResult> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: SIGNED_OUT_ERROR };

  const parsed = createCollectionSchema.safeParse(data);
  if (!parsed.success) {
    return toValidationFailure(parsed.error, "Invalid collection");
  }

  try {
    const upgradeMessage = await checkCollectionLimit(userId);
    if (upgradeMessage) {
      return { success: false, error: upgradeMessage, upgrade: true };
    }

    const collection = await createCollectionQuery(userId, parsed.data);
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
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: SIGNED_OUT_ERROR };

  const id = collectionIdSchema.safeParse(collectionId);
  if (!id.success) return { success: false, error: COLLECTION_NOT_FOUND };

  const parsed = updateCollectionSchema.safeParse(data);
  if (!parsed.success) {
    return toValidationFailure(parsed.error, "Invalid collection");
  }

  try {
    const collection = await updateCollectionQuery(userId, id.data, parsed.data);
    if (!collection) return { success: false, error: COLLECTION_NOT_FOUND };
    return { success: true, data: collection };
  } catch (error) {
    console.error("Update collection failed:", error);
    return {
      success: false,
      error: "Couldn't update the collection. Please try again.",
    };
  }
}

// Takes the new value rather than flipping the stored one, so the server
// always ends up matching what the user sees.
export async function toggleCollectionFavorite(
  collectionId: unknown,
  isFavorite: unknown,
): Promise<FavoriteResult> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: SIGNED_OUT_ERROR };

  const id = collectionIdSchema.safeParse(collectionId);
  if (!id.success) return { success: false, error: COLLECTION_NOT_FOUND };
  const value = z.boolean().safeParse(isFavorite);
  if (!value.success) return { success: false, error: "Invalid favorite value" };

  try {
    const collection = await setCollectionFavorite(userId, id.data, value.data);
    if (!collection) return { success: false, error: COLLECTION_NOT_FOUND };

    refresh();
    return { success: true, data: collection };
  } catch (error) {
    console.error("Toggle collection favorite failed:", error);
    return {
      success: false,
      error: "Couldn't update favorites. Please try again.",
    };
  }
}

// Removes the collection only; its items are kept.
export async function deleteCollection(
  collectionId: unknown,
): Promise<DeleteCollectionResult> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: SIGNED_OUT_ERROR };

  const id = collectionIdSchema.safeParse(collectionId);
  if (!id.success) return { success: false, error: COLLECTION_NOT_FOUND };

  try {
    const deleted = await deleteCollectionQuery(userId, id.data);
    if (!deleted) return { success: false, error: COLLECTION_NOT_FOUND };
    return { success: true, data: deleted };
  } catch (error) {
    console.error("Delete collection failed:", error);
    return {
      success: false,
      error: "Couldn't delete the collection. Please try again.",
    };
  }
}
