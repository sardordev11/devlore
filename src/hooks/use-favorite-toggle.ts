"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import { toggleCollectionFavorite } from "@/actions/collections";
import { toggleItemFavorite } from "@/actions/items";

export type FavoriteTarget = "item" | "collection";

interface UseFavoriteToggleOptions {
  target: FavoriteTarget;
  id: string;
  isFavorite: boolean;
  onChange?: (isFavorite: boolean) => void;
}

const ACTIONS = {
  item: toggleItemFavorite,
  collection: toggleCollectionFavorite,
} as const;

// Optimistic favorite state: flips immediately, rolls back with an error toast
// if the save fails, and follows the prop when the refreshed page brings a new value.
export function useFavoriteToggle({
  target,
  id,
  isFavorite,
  onChange,
}: UseFavoriteToggleOptions) {
  const [value, setValue] = useState(isFavorite);
  const [syncedValue, setSyncedValue] = useState(isFavorite);
  const pendingRef = useRef(false);

  if (isFavorite !== syncedValue) {
    setSyncedValue(isFavorite);
    setValue(isFavorite);
  }

  async function toggle() {
    // Ignore clicks until the current save settles, so requests can't race.
    if (pendingRef.current) return;
    pendingRef.current = true;

    const next = !value;
    setValue(next);
    try {
      const result = await ACTIONS[target](id, next);
      if (result.success) {
        toast.success(next ? "Added to favorites" : "Removed from favorites");
        onChange?.(next);
      } else {
        setValue(!next);
        toast.error(result.error);
      }
    } catch {
      setValue(!next);
      toast.error("Couldn't update favorites. Please try again.");
    } finally {
      pendingRef.current = false;
    }
  }

  return { isFavorite: value, toggle };
}
