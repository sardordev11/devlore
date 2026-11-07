export type FavoriteResult =
  | { success: true; data: { id: string; isFavorite: boolean } }
  | { success: false; error: string };

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
