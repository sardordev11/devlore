import { StarIcon } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { auth } from "@/auth";
import { FavoritesList } from "@/components/favorites/FavoritesList";
import {
  getFavoriteCollections,
  type FavoriteCollection,
} from "@/lib/db/collections";
import { getFavoriteItems, type FavoriteItem } from "@/lib/db/items";
import {
  FAVORITE_SORT_COOKIE,
  resolveFavoriteSort,
} from "@/lib/favorites-sort";
import type { FavoriteEntry } from "@/types/favorites";

const PATHNAME = "/favorites";
const DEFAULT_ACCENT = "#6b7280";

function pluralize(count: number, word: string) {
  return `${count} ${count === 1 ? word : `${word}s`}`;
}

function toItemEntry(item: FavoriteItem): FavoriteEntry {
  return {
    id: item.id,
    title: item.title,
    typeName: item.type.name,
    updatedAt: item.updatedAt.toISOString(),
    icon: item.type.icon,
    color: item.type.color,
    badge: item.type.name,
  };
}

// A collection sorts by type under its dominant type (the first, most-used one).
function toCollectionEntry(collection: FavoriteCollection): FavoriteEntry {
  return {
    id: collection.id,
    title: collection.name,
    typeName: collection.types[0]?.name ?? null,
    updatedAt: collection.updatedAt.toISOString(),
    icon: null,
    color: collection.accentColor ?? DEFAULT_ACCENT,
    badge: pluralize(collection.itemCount, "item"),
  };
}

interface FavoritesPageProps {
  searchParams: Promise<{ sort?: string | string[] }>;
}

export default async function FavoritesPage({ searchParams }: FavoritesPageProps) {
  // User data must be fetched per request, not prerendered at build time.
  await connection();
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(PATHNAME)}`);
  }

  const [items, collections, { sort }, cookieStore] = await Promise.all([
    getFavoriteItems(session.user.id),
    getFavoriteCollections(session.user.id),
    searchParams,
    cookies(),
  ]);
  const initialSort = resolveFavoriteSort(
    sort,
    cookieStore.get(FAVORITE_SORT_COOKIE)?.value,
  );
  const isEmpty = items.length === 0 && collections.length === 0;
  const itemEntries = items.map(toItemEntry);
  const collectionEntries = collections.map(toCollectionEntry);

  const header = (
    <header>
      <h1 className="flex items-center gap-2 text-2xl font-semibold">
        <StarIcon className="size-6 fill-yellow-400 text-yellow-400" />
        Favorites
      </h1>
      <p className="text-muted-foreground">
        {pluralize(items.length, "item")} · {pluralize(collections.length, "collection")}
      </p>
    </header>
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 *:max-w-5xl">
      {isEmpty ? (
        <>
          {header}
          <div className="flex flex-col items-center gap-2 border-y border-border/60 py-12 text-center text-sm text-muted-foreground">
            <StarIcon className="size-5" />
            <p>No favorites yet.</p>
            <p className="text-xs">Star items and collections to see them here.</p>
          </div>
        </>
      ) : (
        <FavoritesList
          // Remounts when navigation brings a different sort (e.g. a ?sort= link).
          key={initialSort}
          header={header}
          initialSort={initialSort}
          items={itemEntries}
          collections={collectionEntries}
        />
      )}
    </div>
  );
}
