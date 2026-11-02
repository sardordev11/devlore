import { createElement } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { auth } from "@/auth";
import { ItemCard } from "@/components/dashboard/ItemCard";
import { getItemsByTypeSlug } from "@/lib/db/items";
import { getTypeIcon } from "@/lib/type-icons";

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

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
      <header className="flex items-center gap-3">
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
      </header>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          No {type.slug} yet.
        </p>
      )}
    </div>
  );
}
