import { FolderIcon, StarIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { auth } from "@/auth";
import { FavoriteRow } from "@/components/favorites/FavoriteRow";
import { FavoritesSection } from "@/components/favorites/FavoritesSection";
import { ItemDrawerTrigger } from "@/components/items/ItemDrawerTrigger";
import { getFavoriteCollections } from "@/lib/db/collections";
import { getFavoriteItems } from "@/lib/db/items";
import { getTypeIcon } from "@/lib/type-icons";

const PATHNAME = "/favorites";
const DEFAULT_ACCENT = "#6b7280";

function pluralize(count: number, word: string) {
  return `${count} ${count === 1 ? word : `${word}s`}`;
}

export default async function FavoritesPage() {
  // User data must be fetched per request, not prerendered at build time.
  await connection();
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(PATHNAME)}`);
  }

  const [items, collections] = await Promise.all([
    getFavoriteItems(session.user.id),
    getFavoriteCollections(session.user.id),
  ]);
  const isEmpty = items.length === 0 && collections.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <StarIcon className="size-6 fill-yellow-400 text-yellow-400" />
          Favorites
        </h1>
        <p className="text-muted-foreground">
          {pluralize(items.length, "item")} · {pluralize(collections.length, "collection")}
        </p>
      </header>

      {isEmpty ? (
        <div className="flex flex-col items-center gap-2 border-y border-border/60 py-12 text-center font-mono text-sm text-muted-foreground">
          <StarIcon className="size-5" />
          <p>No favorites yet.</p>
          <p className="text-xs">Star items and collections to see them here.</p>
        </div>
      ) : (
        <>
          <FavoritesSection
            title="Items"
            count={items.length}
            emptyLabel="No favorite items."
          >
            {items.map((item) => (
              <li key={item.id}>
                <ItemDrawerTrigger itemId={item.id}>
                  <FavoriteRow
                    icon={getTypeIcon(item.type.icon)}
                    color={item.type.color}
                    title={item.title}
                    badge={item.type.name}
                    date={item.updatedAt}
                  />
                </ItemDrawerTrigger>
              </li>
            ))}
          </FavoritesSection>

          <FavoritesSection
            title="Collections"
            count={collections.length}
            emptyLabel="No favorite collections."
          >
            {collections.map((collection) => (
              <li key={collection.id}>
                <Link
                  href={`/collections/${collection.id}`}
                  className="block outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <FavoriteRow
                    icon={FolderIcon}
                    color={collection.accentColor ?? DEFAULT_ACCENT}
                    title={collection.name}
                    badge={pluralize(collection.itemCount, "item")}
                    date={collection.updatedAt}
                  />
                </Link>
              </li>
            ))}
          </FavoritesSection>
        </>
      )}
    </div>
  );
}
