export type FavoriteResult =
  | { success: true; data: { id: string; isFavorite: boolean } }
  | { success: false; error: string };
