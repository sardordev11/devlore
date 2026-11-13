"use client";

import { FolderIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { FavoriteRow } from "@/components/favorites/FavoriteRow";
import { FavoritesSection } from "@/components/favorites/FavoritesSection";
import { ItemDrawerTrigger } from "@/components/items/ItemDrawerTrigger";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FAVORITE_SORT_OPTIONS,
  getFavoriteSortCookie,
  getFavoriteSortHref,
  isFavoriteSort,
  sortFavorites,
  type FavoriteSort,
} from "@/lib/favorites-sort";
import { getTypeIcon } from "@/lib/type-icons";
import type { FavoriteEntry } from "@/types/favorites";

interface FavoritesListProps {
  // Page title, rendered next to the sort control.
  header: React.ReactNode;
  // From `?sort=`, parsed on the server.
  initialSort: FavoriteSort;
  items: FavoriteEntry[];
  collections: FavoriteEntry[];
}

interface SortSelectProps {
  value: FavoriteSort;
  onChange: (value: FavoriteSort) => void;
}

function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span id="favorites-sort-label">Sort by</span>
      <Select
        items={FAVORITE_SORT_OPTIONS}
        value={value}
        onValueChange={(next) => {
          if (isFavoriteSort(next)) onChange(next);
        }}
      >
        <SelectTrigger
          size="sm"
          aria-labelledby="favorites-sort-label"
          className="w-24 text-xs"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FAVORITE_SORT_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="text-xs"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Favorite items and collections, sorted on the client by name, date or type.
export function FavoritesList({
  header,
  initialSort,
  items,
  collections,
}: FavoritesListProps) {
  const [sort, setSort] = useState(initialSort);

  // Keeps the sort in the URL without a server round trip (Next syncs
  // native history updates with its router) and in a cookie for later visits.
  function handleSortChange(next: FavoriteSort) {
    setSort(next);
    document.cookie = getFavoriteSortCookie(next);
    window.history.replaceState(
      null,
      "",
      getFavoriteSortHref(window.location.href, next),
    );
  }
  const sortedItems = useMemo(() => sortFavorites(items, sort), [items, sort]);
  const sortedCollections = useMemo(
    () => sortFavorites(collections, sort),
    [collections, sort],
  );

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        {header}
        <SortSelect value={sort} onChange={handleSortChange} />
      </div>

      <FavoritesSection
        title="Items"
        count={sortedItems.length}
        emptyLabel="No favorite items."
      >
        {sortedItems.map((item) => (
          <li key={item.id}>
            <ItemDrawerTrigger itemId={item.id}>
              <FavoriteRow
                icon={getTypeIcon(item.icon ?? "")}
                color={item.color}
                title={item.title}
                badge={item.badge}
                date={item.updatedAt}
              />
            </ItemDrawerTrigger>
          </li>
        ))}
      </FavoritesSection>

      <FavoritesSection
        title="Collections"
        count={sortedCollections.length}
        emptyLabel="No favorite collections."
      >
        {sortedCollections.map((collection) => (
          <li key={collection.id}>
            <Link
              href={`/collections/${collection.id}`}
              className="block outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <FavoriteRow
                icon={FolderIcon}
                color={collection.color}
                title={collection.title}
                badge={collection.badge}
                date={collection.updatedAt}
              />
            </Link>
          </li>
        ))}
      </FavoritesSection>
    </>
  );
}
