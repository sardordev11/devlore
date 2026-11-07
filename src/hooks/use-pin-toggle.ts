"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import { toggleItemPin } from "@/actions/items";

interface UsePinToggleOptions {
  id: string;
  isPinned: boolean;
  onChange?: (isPinned: boolean) => void;
}

// Optimistic pin state: flips immediately, rolls back with an error toast
// if the save fails, and follows the prop when the refreshed page brings a new value.
export function usePinToggle({ id, isPinned, onChange }: UsePinToggleOptions) {
  const [value, setValue] = useState(isPinned);
  const [syncedValue, setSyncedValue] = useState(isPinned);
  const pendingRef = useRef(false);

  if (isPinned !== syncedValue) {
    setSyncedValue(isPinned);
    setValue(isPinned);
  }

  async function toggle() {
    // Ignore clicks until the current save settles, so requests can't race.
    if (pendingRef.current) return;
    pendingRef.current = true;

    const next = !value;
    setValue(next);
    try {
      const result = await toggleItemPin(id, next);
      if (result.success) {
        toast.success(next ? "Item pinned" : "Item unpinned");
        onChange?.(next);
      } else {
        setValue(!next);
        toast.error(result.error);
      }
    } catch {
      setValue(!next);
      toast.error("Couldn't update the pin. Please try again.");
    } finally {
      pendingRef.current = false;
    }
  }

  return { isPinned: value, toggle };
}
