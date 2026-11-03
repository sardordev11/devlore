"use server";

import { z } from "zod";

import { auth } from "@/auth";
import {
  createItem as createItemQuery,
  deleteItem as deleteItemQuery,
  updateItem as updateItemQuery,
  type ItemDetail,
} from "@/lib/db/items";
import {
  createItemSchema,
  itemIdSchema,
  updateItemSchema,
} from "@/lib/validations/items";
import type { ItemDetailJson, ItemDetailResponse } from "@/types/items";

type CreateItemResult =
  | ItemDetailResponse
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

export async function createItem(data: unknown): Promise<CreateItemResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in" };
  }

  const parsed = createItemSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid item",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    const item = await createItemQuery(session.user.id, parsed.data);
    if (!item) return { success: false, error: "Item type not found" };

    return { success: true, data: toItemDetailJson(item) };
  } catch (error) {
    console.error("Create item failed:", error);
    return {
      success: false,
      error: "Couldn't create the item. Please try again.",
    };
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
    const item = await updateItemQuery(session.user.id, itemId, parsed.data);
    if (!item) return { success: false, error: "Item not found" };

    return { success: true, data: toItemDetailJson(item) };
  } catch (error) {
    console.error("Update item failed:", error);
    return { success: false, error: "Couldn't save the item. Please try again." };
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

    return { success: true, data: { id: parsed.data } };
  } catch (error) {
    console.error("Delete item failed:", error);
    return {
      success: false,
      error: "Couldn't delete the item. Please try again.",
    };
  }
}
