import { connection } from "next/server";
import { Suspense } from "react";

import { auth } from "@/auth";
import { CommandPalette } from "@/components/search/CommandPalette";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import { getAllCollections } from "@/lib/db/collections";
import { getSearchItems } from "@/lib/db/items";

async function SearchDataLoader() {
  // User data must be fetched per request, not prerendered at build time.
  await connection();
  const session = await auth();
  if (!session?.user?.id) return <SearchTrigger />;

  const userId = session.user.id;
  const [items, collections] = await Promise.all([
    getSearchItems(userId),
    getAllCollections(userId),
  ]);

  return (
    <CommandPalette
      data={{
        items,
        collections: collections.map(({ id, name, itemCount }) => ({
          id,
          name,
          itemCount,
        })),
      }}
    />
  );
}

// Loads the searchable data with the page so the palette filters on the client.
export function GlobalSearch() {
  return (
    <Suspense fallback={<SearchTrigger />}>
      <SearchDataLoader />
    </Suspense>
  );
}
