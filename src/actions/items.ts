"use server";

import { z } from "zod";

import { auth } from "@/auth";
import { updateItem as updateItemQuery } from "@/lib/db/items";
import { updateItemSchema } from "@/lib/validations/items";
import type { ItemDetailResponse } from "@/types/items";

type UpdateItemResult =
  | ItemDetailResponse
  | {
      success: false;
      error: string;
      fieldErrors: Partial<Record<keyof z.input<typeof updateItemSchema>, string[]>>;
    };

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

    return {
      success: true,
      data: {
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Update item failed:", error);
    return { success: false, error: "Couldn't save the item. Please try again." };
  }
}
