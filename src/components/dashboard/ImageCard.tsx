import { ImageIcon, PinIcon, StarIcon } from "lucide-react";

import { ItemDrawerTrigger } from "@/components/items/ItemDrawerTrigger";
import { Card } from "@/components/ui/card";
import type { ItemSummary } from "@/lib/db/items";

interface ImageCardProps {
  item: ItemSummary;
}

export function ImageCard({ item }: ImageCardProps) {
  return (
    <ItemDrawerTrigger itemId={item.id}>
      <Card className="group h-full gap-0 overflow-hidden py-0 transition-colors hover:bg-muted/40">
        <div className="relative aspect-video overflow-hidden bg-muted/40">
          {item.fileUrl ? (
            // Served from the public R2 domain, which next/image isn't configured for.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.fileUrl}
              alt={item.title}
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <ImageIcon className="size-8" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 px-4 py-3">
          <h3 className="truncate font-medium">{item.title}</h3>
          {item.isPinned && (
            <PinIcon className="size-3.5 shrink-0 text-muted-foreground" />
          )}
          {item.isFavorite && (
            <StarIcon className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
          )}
        </div>
      </Card>
    </ItemDrawerTrigger>
  );
}
