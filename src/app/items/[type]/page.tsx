import { createElement } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { auth } from "@/auth";
import { FileRow } from "@/components/dashboard/FileRow";
import { ImageCard } from "@/components/dashboard/ImageCard";
import { ItemCard } from "@/components/dashboard/ItemCard";
import { CreateItemDialog } from "@/components/items/CreateItemDialog";
import { PaginationControls } from "@/components/pagination/PaginationControls";
import { UPGRADE_PATH } from "@/lib/billing-display";
import { getItemsByTypeSlug } from "@/lib/db/items";
import {
  getPageCount,
  getPageHref,
  ITEMS_PER_PAGE,
  parsePage,
} from "@/lib/pagination";
import { canViewTypeSlug } from "@/lib/plan-gate";
import { TOUCH_ICON_ROW_SPACER } from "@/lib/touch-target";
import { getTypeIcon, getTypeTint } from "@/lib/type-icons";
import { isCreatableTypeSlug } from "@/lib/validations/items";

export default async function ItemsByTypePage({
  params,
  searchParams,
}: PageProps<"/items/[type]">) {
  // User data must be fetched per request, not prerendered at build time.
  await connection();
  const { type: slug } = await params;
  const page = parsePage((await searchParams).page);
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/items/${slug}`)}`);
  }

  // Checked before loading items so free users never fetch Pro-only listings
  if (!(await canViewTypeSlug(session.user.id, slug))) redirect(UPGRADE_PATH);

  const listing = await getItemsByTypeSlug(session.user.id, slug, page);
  if (!listing) notFound();

  const { type, items, total } = listing;
  const pathname = `/items/${type.slug}`;
  const pageCount = getPageCount(total, ITEMS_PER_PAGE);
  if (page > pageCount) redirect(getPageHref(pathname, pageCount));

  const title = type.slug.charAt(0).toUpperCase() + type.slug.slice(1);
  const countLabel = `${total} ${total === 1 ? type.name : type.slug}`;
  const isGallery = type.slug === "images";
  const isFileList = type.slug === "files";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-lg"
            // 1a = ~10% alpha on the hex type color.
            style={getTypeTint(type.color)}
          >
            {createElement(getTypeIcon(type.icon), { className: "size-5" })}
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="text-muted-foreground">{countLabel}</p>
          </div>
        </div>
        {isCreatableTypeSlug(type.slug) && (
          <CreateItemDialog defaultType={type.slug} />
        )}
      </header>

      {items.length > 0 && isFileList ? (
        <div className="flex flex-col gap-2">
          {/* Mirrors FileRow's layout (border, icon, gaps) so the columns line up. */}
          <div className="hidden items-center gap-3 border border-transparent px-4 text-xs font-medium text-muted-foreground md:flex">
            <span className="w-9 shrink-0" />
            <div className="flex flex-1 items-center gap-4">
              <span className="flex-1">Name</span>
              <span className="w-20 text-right">Size</span>
              <span className="w-28 text-right">Uploaded</span>
            </div>
            <span className={`shrink-0 ${TOUCH_ICON_ROW_SPACER}`} />
          </div>
          {items.map((item) => (
            <FileRow key={item.id} item={item} />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) =>
            isGallery ? (
              <ImageCard key={item.id} item={item} />
            ) : (
              <ItemCard key={item.id} item={item} />
            ),
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
          <div
            className="flex size-12 items-center justify-center rounded-xl"
            style={getTypeTint(type.color)}
          >
            {createElement(getTypeIcon(type.icon), { className: "size-6" })}
          </div>
          <div>
            <p className="font-medium">No {type.slug} yet</p>
            <p className="text-sm text-muted-foreground">
              Your {type.slug} will show up here.
            </p>
          </div>
          {isCreatableTypeSlug(type.slug) && (
            <CreateItemDialog defaultType={type.slug} />
          )}
        </div>
      )}

      <PaginationControls pathname={pathname} page={page} pageCount={pageCount} />
    </div>
  );
}
