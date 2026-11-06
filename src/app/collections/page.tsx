import { redirect } from "next/navigation";
import { connection } from "next/server";

import { auth } from "@/auth";
import { CollectionCard } from "@/components/dashboard/CollectionCard";
import { PaginationControls } from "@/components/pagination/PaginationControls";
import { getCollectionsPage } from "@/lib/db/collections";
import {
  COLLECTIONS_PER_PAGE,
  getPageCount,
  getPageHref,
  parsePage,
} from "@/lib/pagination";

const PATHNAME = "/collections";

export default async function CollectionsPage({
  searchParams,
}: PageProps<"/collections">) {
  // User data must be fetched per request, not prerendered at build time.
  await connection();
  const page = parsePage((await searchParams).page);
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(PATHNAME)}`);
  }

  const { collections, total } = await getCollectionsPage(session.user.id, page);
  const pageCount = getPageCount(total, COLLECTIONS_PER_PAGE);
  if (page > pageCount) redirect(getPageHref(PATHNAME, pageCount));

  const countLabel = `${total} ${total === 1 ? "collection" : "collections"}`;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
      <header>
        <h1 className="text-2xl font-semibold">Collections</h1>
        <p className="text-muted-foreground">{countLabel}</p>
      </header>

      {collections.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          No collections yet.
        </p>
      )}

      <PaginationControls pathname={PATHNAME} page={page} pageCount={pageCount} />
    </div>
  );
}
