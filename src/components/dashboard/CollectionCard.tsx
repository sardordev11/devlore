import { StarIcon } from "lucide-react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import type { CollectionSummary } from "@/lib/db/collections";
import { getTypeIcon } from "@/lib/type-icons";

interface CollectionCardProps {
  collection: CollectionSummary;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const { types, accentColor } = collection;

  return (
    <Link
      href={`/collections/${collection.id}`}
      className="group/collection rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <Card
        className="h-full border-l-2 transition-colors group-hover/collection:bg-muted/40"
        // Type colors are dynamic data, so they can't be static Tailwind classes.
        style={{ borderLeftColor: accentColor ?? undefined }}
      >
        <CardContent className="flex h-full flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-medium">{collection.name}</h3>
            {collection.isFavorite && (
              <StarIcon className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
            )}
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
    </Link>
  );
}
