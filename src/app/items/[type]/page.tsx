import { createElement } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { auth } from "@/auth";
import { FileRow } from "@/components/dashboard/FileRow";
import { ImageCard } from "@/components/dashboard/ImageCard";
import { ItemCard } from "@/components/dashboard/ItemCard";
import { CreateItemDialog } from "@/components/items/CreateItemDialog";
import { getItemsByTypeSlug } from "@/lib/db/items";
import { getTypeIcon } from "@/lib/type-icons";
import { isCreatableTypeSlug } from "@/lib/validations/items";

export default async function ItemsByTypePage({
  params,
}: PageProps<"/items/[type]">) {
  // User data must be fetched per request, not prerendered at build time.
  await connection();
  const { type: slug } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/items/${slug}`)}`);
  }

  const listing = await getItemsByTypeSlug(session.user.id, slug);
  if (!listing) notFound();

  const { type, items } = listing;
  const title = type.slug.charAt(0).toUpperCase() + type.slug.slice(1);
  const countLabel = `${items.length} ${items.length === 1 ? type.name : type.slug}`;
  const isGallery = type.slug === "images";
  const isFileList = type.slug === "files";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-lg"
            // 1a = ~10% alpha on the hex type color.
            style={{ backgroundColor: `${type.color}1a`, color: type.color }}
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
            <span className="w-8 shrink-0" />
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
        <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          No {type.slug} yet.
        </p>
      )}
    </div>
  );
}
