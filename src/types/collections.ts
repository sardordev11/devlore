// The editable metadata of a collection, passed to client components.
export interface CollectionMeta {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
}
