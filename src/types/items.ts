import type { ItemDetail } from "@/lib/db/items";

// ItemDetail as received from GET /api/items/[id]: dates arrive as ISO strings.
export type ItemDetailJson = Omit<ItemDetail, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type PinResult =
  | { success: true; data: { id: string; isPinned: boolean } }
  | { success: false; error: string };

export type ItemDetailResponse =
  { success: true; data: ItemDetailJson } | { success: false; error: string };
