"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { ownsCollections } from "@/lib/db/collections";
import {
  createItem as createItemQuery,
  deleteItem as deleteItemQuery,
  isFileKeyInUse,
  setItemFavorite,
  setItemPinned,
  updateItem as updateItemQuery,
  type ItemDetail,
} from "@/lib/db/items";
import { checkItemLimit } from "@/lib/plan-gate";
import { deleteFile, getFileKey, isOwnedFileKey } from "@/lib/r2";
import {
  createItemSchema,
  itemIdSchema,
  updateItemSchema,
} from "@/lib/validations/items";
import type { FavoriteResult } from "@/types/favorites";
import type {
  ItemDetailJson,
  ItemDetailResponse,
  PinResult,
} from "@/types/items";

type CreateItemResult =
  | ItemDetailResponse
  // upgrade: a plan limit was hit, so the client offers the upgrade link
  | { success: false; error: string; upgrade: true }
  | {
      success: false;
      error: string;
      fieldErrors: Partial<Record<keyof z.input<typeof createItemSchema>, string[]>>;
    };

type UpdateItemResult =
  | ItemDetailResponse
  | {
      success: false;
      error: string;
      fieldErrors: Partial<Record<keyof z.input<typeof updateItemSchema>, string[]>>;
    };

const COLLECTION_NOT_FOUND = "Collection not found";

type DeleteItemResult =
  | { success: true; data: { id: string } }
  | { success: false; error: string };

function toItemDetailJson(item: ItemDetail): ItemDetailJson {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

// Best effort: a failed delete only leaves an orphaned object behind.
async function removeFile(key: string) {
  try {
    await deleteFile(key);
  } catch (error) {
    console.error("R2 delete failed:", error);
  }
}

function getUploadedKey(data: unknown): string | null {
  const file = (data as { file?: { key?: unknown } } | null)?.file;
  return typeof file?.key === "string" ? file.key : null;
}

export async function createItem(data: unknown): Promise<CreateItemResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in" };
  }
  const userId = session.user.id;

  // The client uploads before creating; an upload that doesn't become an item is removed.
  const uploadedKey = getUploadedKey(data);
  const ownsUpload = uploadedKey !== null && isOwnedFileKey(userId, uploadedKey);
  async function fail(result: CreateItemResult): Promise<CreateItemResult> {
    if (ownsUpload && uploadedKey) await removeFile(uploadedKey);
    return result;
  }

  const parsed = createItemSchema.safeParse(data);
  if (!parsed.success) {
    return fail({
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid item",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    });
  }
  if (parsed.data.file && !ownsUpload) {
    return { success: false, error: "File not found", fieldErrors: {} };
  }

  try {
    // fail() so an upload for a Pro-only type doesn't stay in R2
    const upgradeMessage = await checkItemLimit(userId, parsed.data.type);
    if (upgradeMessage) {
      return fail({ success: false, error: upgradeMessage, upgrade: true });
    }

    // Two items sharing one object would lose the file when either is deleted.
    // The object belongs to the existing item, so it isn't removed here.
    if (parsed.data.file && (await isFileKeyInUse(userId, parsed.data.file.key))) {
      return { success: false, error: "File is already attached to another item" };
    }
    if (!(await ownsCollections(userId, parsed.data.collectionIds))) {
      return fail({
        success: false,
        error: COLLECTION_NOT_FOUND,
        fieldErrors: { collectionIds: [COLLECTION_NOT_FOUND] },
      });
    }

    const item = await createItemQuery(userId, parsed.data);
    if (!item) return fail({ success: false, error: "Item type not found" });

    // Send the refreshed page back with this response, so the new item shows
    // up together with the success toast instead of a round trip later.
    refresh();
    return { success: true, data: toItemDetailJson(item) };
  } catch (error) {
    console.error("Create item failed:", error);
    return fail({
      success: false,
      error: "Couldn't create the item. Please try again.",
    });
  }
}

export async function updateItem(
  itemId: string,
  data: unknown,
): Promise<UpdateItemResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in" };
  }

  const parsed = updateItemSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid item",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    const { collectionIds } = parsed.data;
    if (collectionIds && !(await ownsCollections(session.user.id, collectionIds))) {
      return {
        success: false,
        error: COLLECTION_NOT_FOUND,
        fieldErrors: { collectionIds: [COLLECTION_NOT_FOUND] },
      };
    }

    const item = await updateItemQuery(session.user.id, itemId, parsed.data);
    if (!item) return { success: false, error: "Item not found" };

    return { success: true, data: toItemDetailJson(item) };
  } catch (error) {
    console.error("Update item failed:", error);
    return { success: false, error: "Couldn't save the item. Please try again." };
  }
}

// Takes the new value rather than flipping the stored one, so the server
// always ends up matching what the user sees.
export async function toggleItemFavorite(
  itemId: unknown,
  isFavorite: unknown,
): Promise<FavoriteResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in" };
  }

  const id = itemIdSchema.safeParse(itemId);
  if (!id.success) return { success: false, error: "Item not found" };
  const value = z.boolean().safeParse(isFavorite);
  if (!value.success) return { success: false, error: "Invalid favorite value" };

  try {
    const item = await setItemFavorite(session.user.id, id.data, value.data);
    if (!item) return { success: false, error: "Item not found" };

    refresh();
    return { success: true, data: item };
  } catch (error) {
    console.error("Toggle item favorite failed:", error);
    return {
      success: false,
      error: "Couldn't update favorites. Please try again.",
    };
  }
}

// Like toggleItemFavorite, takes the new value rather than flipping the stored one.
export async function toggleItemPin(
  itemId: unknown,
  isPinned: unknown,
): Promise<PinResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in" };
  }

  const id = itemIdSchema.safeParse(itemId);
  if (!id.success) return { success: false, error: "Item not found" };
  const value = z.boolean().safeParse(isPinned);
  if (!value.success) return { success: false, error: "Invalid pin value" };

  try {
    const item = await setItemPinned(session.user.id, id.data, value.data);
    if (!item) return { success: false, error: "Item not found" };

    refresh();
    return { success: true, data: item };
  } catch (error) {
    console.error("Toggle item pin failed:", error);
    return {
      success: false,
      error: "Couldn't update the pin. Please try again.",
    };
  }
}

export async function deleteItem(itemId: unknown): Promise<DeleteItemResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in" };
  }

  const parsed = itemIdSchema.safeParse(itemId);
  if (!parsed.success) {
    return { success: false, error: "Item not found" };
  }

  try {
    const deleted = await deleteItemQuery(session.user.id, parsed.data);
    if (!deleted) return { success: false, error: "Item not found" };

    const fileKey = deleted.fileUrl ? getFileKey(deleted.fileUrl) : null;
    if (fileKey) await removeFile(fileKey);

    return { success: true, data: { id: parsed.data } };
  } catch (error) {
    console.error("Delete item failed:", error);
    return {
      success: false,
      error: "Couldn't delete the item. Please try again.",
    };
  }
}
