import { FolderOpenIcon, StarIcon } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { auth } from "@/auth";
import { CollectionActions } from "@/components/collections/CollectionActions";
import { ItemCard } from "@/components/dashboard/ItemCard";
import { PaginationControls } from "@/components/pagination/PaginationControls";
import { getCollection } from "@/lib/db/collections";
import { getItemsByCollection } from "@/lib/db/items";
import {
  getPageCount,
  getPageHref,
  ITEMS_PER_PAGE,
  parsePage,
} from "@/lib/pagination";
import { getTypeTint } from "@/lib/type-icons";

const DEFAULT_ACCENT = "#6b7280";

export default async function CollectionPage({
  params,
  searchParams,
}: PageProps<"/collections/[id]">) {
  // User data must be fetched per request, not prerendered at build time.
  await connection();
  const { id } = await params;
  const page = parsePage((await searchParams).page);
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/collections/${id}`)}`);
  }

  // Both queries are scoped to the user, so they can run together.
  const [collection, { items, total }] = await Promise.all([
    getCollection(session.user.id, id),
    getItemsByCollection(session.user.id, id, page),
  ]);
  if (!collection) notFound();

  const pathname = `/collections/${collection.id}`;
  const pageCount = getPageCount(total, ITEMS_PER_PAGE);
  if (page > pageCount) redirect(getPageHref(pathname, pageCount));

  const countLabel = `${total} ${total === 1 ? "item" : "items"}`;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
      <header className="flex items-start gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-lg"
          // Collection accent comes from its dominant type, so it's dynamic data.
          style={getTypeTint(collection.accentColor ?? DEFAULT_ACCENT)}
        >
          <FolderOpenIcon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-2xl font-semibold">{collection.name}</h1>
            {collection.isFavorite && (
              <StarIcon
                className="size-4 shrink-0 fill-yellow-400 text-yellow-400"
                aria-label="Favorite"
              />
            )}
          </div>
          <p className="text-muted-foreground">{countLabel}</p>
          {collection.description && (
            <p className="mt-2 max-w-3xl text-muted-foreground">
              {collection.description}
            </p>
          )}
        </div>
        <CollectionActions
          collection={{
            id: collection.id,
            name: collection.name,
            description: collection.description,
            isFavorite: collection.isFavorite,
          }}
        />
      </header>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          No items in this collection yet.
        </p>
      )}

      <PaginationControls pathname={pathname} page={page} pageCount={pageCount} />
    </div>
  );
}
