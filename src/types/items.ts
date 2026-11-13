import type { ItemDetail } from "@/lib/db/items";
import type { ActionResult } from "@/types/actions";

// ItemDetail as received from GET /api/items/[id]: dates arrive as ISO strings.
export type ItemDetailJson = Omit<ItemDetail, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type PinResult = ActionResult<{ id: string; isPinned: boolean }>;

export type ItemDetailResponse = ActionResult<ItemDetailJson>;
