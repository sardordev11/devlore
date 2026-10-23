import { PinIcon, StarIcon } from "lucide-react";
import { createElement } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getItemType } from "@/lib/dashboard";
import type { MockItem } from "@/lib/mock-data";
import { getTypeIcon } from "@/lib/type-icons";

// UTC keeps the server-rendered date stable regardless of the server's time zone.
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

interface ItemCardProps {
  item: MockItem;
}

export function ItemCard({ item }: ItemCardProps) {
  const type = getItemType(item.typeId);
  const date = item.lastUsedAt ?? item.createdAt;

  return (
    <Card
      className="border-l-2 transition-colors hover:bg-muted/40"
      // Type colors are dynamic data, so they can't be static Tailwind classes.
      style={{ borderLeftColor: type?.color }}
    >
      <CardContent className="flex items-start gap-4">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-lg"
          // 1a = ~10% alpha on the hex type color.
          style={{ backgroundColor: `${type?.color}1a`, color: type?.color }}
        >
          {createElement(getTypeIcon(type?.icon ?? ""), { className: "size-5" })}
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
          <p className="mt-0.5 truncate text-muted-foreground">
            {item.description}
          </p>
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

        <time
          dateTime={date}
          className="shrink-0 text-xs text-muted-foreground"
        >
          {DATE_FORMAT.format(new Date(date))}
        </time>
      </CardContent>
    </Card>
  );
}
