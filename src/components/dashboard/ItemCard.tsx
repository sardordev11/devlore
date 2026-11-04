import { PinIcon, StarIcon } from "lucide-react";
import { createElement } from "react";

import { CopyButton } from "@/components/items/CopyButton";
import { ItemDrawerTrigger } from "@/components/items/ItemDrawerTrigger";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ItemSummary } from "@/lib/db/items";
import { formatDate } from "@/lib/format-date";
import { getTypeIcon, getTypeTint } from "@/lib/type-icons";

interface ItemCardProps {
  item: ItemSummary;
}

export function ItemCard({ item }: ItemCardProps) {
  const { type } = item;
  const date = item.lastUsedAt ?? item.createdAt;

  return (
    <ItemDrawerTrigger itemId={item.id}>
      <Card
        className="h-full border-l-2 transition-colors hover:bg-muted/40"
        // Type colors are dynamic data, so they can't be static Tailwind classes.
        style={{ borderLeftColor: type.color }}
      >
        <CardContent className="flex items-start gap-4">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-lg"
            // 1a = ~10% alpha on the hex type color.
            style={getTypeTint(type.color)}
            aria-label={type.name}
          >
            {createElement(getTypeIcon(type.icon), { className: "size-5" })}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate font-medium">{item.title}</h3>
              {item.isPinned && (
                <PinIcon className="size-3.5 shrink-0 text-muted-foreground" />
              )}
              {item.isFavorite && (
                <StarIcon className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
              )}
            </div>
            {item.description && (
              <p className="mt-0.5 truncate text-muted-foreground">
                {item.description}
              </p>
            )}
            {item.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1">
            <time
              dateTime={date.toISOString()}
              className="text-xs text-muted-foreground"
            >
              {formatDate(date, "short")}
            </time>
            {item.copyValue && (
              <CopyButton
                value={item.copyValue}
                size="icon-sm"
                className="-mr-1.5"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </ItemDrawerTrigger>
  );
}
