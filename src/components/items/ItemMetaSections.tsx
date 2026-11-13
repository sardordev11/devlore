"use client";

import { CalendarIcon, FolderIcon } from "lucide-react";

import { DetailSection } from "@/components/items/DetailSection";
import { Badge } from "@/components/ui/badge";
import { formatLocalDate } from "@/lib/format-date";
import type { ItemDetailJson } from "@/types/items";

interface ItemMetaSectionsProps {
  item: ItemDetailJson;
  // The edit form shows a collection picker instead.
  showCollections?: boolean;
}

// Collections and dates, shown read-only. Edit mode keeps only the dates.
export function ItemMetaSections({
  item,
  showCollections = true,
}: ItemMetaSectionsProps) {
  return (
    <>
      {showCollections && item.collections.length > 0 && (
        <DetailSection title="Collections" icon={FolderIcon}>
          <div className="flex flex-wrap gap-1.5">
            {item.collections.map((collection) => (
              <Badge key={collection.id} variant="outline">
                {collection.name}
              </Badge>
            ))}
          </div>
        </DetailSection>
      )}

      <DetailSection title="Details" icon={CalendarIcon}>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
          <dt className="text-muted-foreground">Created</dt>
          <dd className="text-right">
            {formatLocalDate(item.createdAt, "long")}
          </dd>
          <dt className="text-muted-foreground">Updated</dt>
          <dd className="text-right">
            {formatLocalDate(item.updatedAt, "long")}
          </dd>
        </dl>
      </DetailSection>
    </>
  );
}
