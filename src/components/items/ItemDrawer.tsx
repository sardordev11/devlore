"use client";

import { createElement, useState } from "react";

import { ItemDrawerActions } from "@/components/items/ItemDrawerActions";
import { ItemDrawerDetails } from "@/components/items/ItemDrawerDetails";
import { ItemEditForm } from "@/components/items/ItemEditForm";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { getTypeIcon } from "@/lib/type-icons";
import type { ItemDetailJson } from "@/types/items";

interface ItemDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ItemDetailJson | null;
  error: string | null;
  onItemUpdated: (item: ItemDetailJson) => void;
}

export function ItemDrawer({
  open,
  onOpenChange,
  item,
  error,
  onItemUpdated,
}: ItemDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="gap-0 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-xl"
        // Dim instead of blur so the page behind stays readable.
        overlayClassName="bg-black/50 supports-backdrop-filter:backdrop-blur-none"
      >
        {item ? (
          // Keyed so edit mode resets when another item opens.
          <ItemDrawerBody
            key={item.id}
            item={item}
            onItemUpdated={onItemUpdated}
          />
        ) : error ? (
          <SheetHeader className="p-6">
            <SheetTitle>Couldn&apos;t open item</SheetTitle>
            <p className="text-muted-foreground">{error}</p>
          </SheetHeader>
        ) : (
          <ItemDrawerSkeleton />
        )}
      </SheetContent>
    </Sheet>
  );
}

function ItemDrawerBody({
  item,
  onItemUpdated,
}: {
  item: ItemDetailJson;
  onItemUpdated: (item: ItemDetailJson) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);

  function handleSaved(updated: ItemDetailJson) {
    onItemUpdated(updated);
    setIsEditing(false);
  }

  return (
    <>
      <ItemDrawerHeader item={item} />
      {isEditing ? (
        <ItemEditForm
          item={item}
          onCancel={() => setIsEditing(false)}
          onSaved={handleSaved}
        />
      ) : (
        <>
          <ItemDrawerActions item={item} onEdit={() => setIsEditing(true)} />
          <ItemDrawerDetails item={item} />
        </>
      )}
    </>
  );
}

function ItemDrawerHeader({ item }: { item: ItemDetailJson }) {
  const { type } = item;
  const typeLabel = type.slug.charAt(0).toUpperCase() + type.slug.slice(1);

  return (
    <SheetHeader className="flex-row items-start gap-3 p-6 pr-12">
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-lg"
        // 1a = ~10% alpha on the hex type color.
        style={{ backgroundColor: `${type.color}1a`, color: type.color }}
      >
        {createElement(getTypeIcon(type.icon), { className: "size-5" })}
      </div>
      <div className="min-w-0">
        <SheetTitle className="text-lg font-semibold break-words">
          {item.title}
        </SheetTitle>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <Badge variant="secondary">{typeLabel}</Badge>
          {item.language && <Badge variant="outline">{item.language}</Badge>}
        </div>
      </div>
    </SheetHeader>
  );
}

function ItemDrawerSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6" aria-busy="true">
      <SheetTitle className="sr-only">Loading item</SheetTitle>
      <div className="flex items-start gap-3">
        <Skeleton className="size-10 rounded-lg" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-5 w-28" />
        </div>
      </div>
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-16 w-full" />
    </div>
  );
}
