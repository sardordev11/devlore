import type { ActionResult } from "@/types/actions";

export type FavoriteResult = ActionResult<{ id: string; isFavorite: boolean }>;

// A serializable favorite row, sorted on the client by `sortFavorites`.
export interface FavoriteEntry {
  id: string;
  title: string;
  // Item type, or a collection's dominant type (null when it's empty).
  typeName: string | null;
  // ISO date string.
  updatedAt: string;
  // Lucide icon name of the item type; collections always show a folder.
  icon: string | null;
  color: string;
  badge: string;
}
