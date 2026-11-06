import { StarIcon } from "lucide-react";
import Link from "next/link";

import { CollectionActionsMenu } from "@/components/collections/CollectionActionsMenu";
import { Card, CardContent } from "@/components/ui/card";
import type { CollectionSummary } from "@/lib/db/collections";
import { getTypeIcon } from "@/lib/type-icons";

interface CollectionCardProps {
  collection: CollectionSummary;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const { types, accentColor } = collection;

  // The link is stretched over the whole card with ::after, and the menu sits
  // above it, so clicking anywhere but the menu opens the collection without
  // nesting a button inside a link.
  return (
    <Card
      className="relative h-full border-l-2 transition-colors hover:bg-muted/40 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring"
      // Type colors are dynamic data, so they can't be static Tailwind classes.
      style={{ borderLeftColor: accentColor ?? undefined }}
    >
      <CardContent className="flex h-full flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <h3 className="min-w-0 truncate font-medium">
            <Link
              href={`/collections/${collection.id}`}
              className="outline-none after:absolute after:inset-0 after:rounded-xl"
            >
              {collection.name}
            </Link>
          </h3>
          {collection.isFavorite && (
            <StarIcon className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
          )}
          <CollectionActionsMenu
            collection={{
              id: collection.id,
              name: collection.name,
              description: collection.description,
              isFavorite: collection.isFavorite,
            }}
            className="relative z-10 -my-1 -mr-2 ml-auto shrink-0 text-muted-foreground"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
        </p>
        {collection.description && (
          <p className="mt-2 line-clamp-2 text-muted-foreground">
            {collection.description}
          </p>
        )}
        <div className="mt-auto flex items-center gap-2 pt-3">
          {types.map((type) => {
            const Icon = getTypeIcon(type.icon);
            return (
              <Icon
                key={type.id}
                className="size-4"
                style={{ color: type.color }}
                aria-label={type.name}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
