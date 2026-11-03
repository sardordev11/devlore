"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

import { ItemDrawer } from "@/components/items/ItemDrawer";
import type { ItemDetailJson, ItemDetailResponse } from "@/types/items";

interface ItemDrawerContextValue {
  openItem: (itemId: string) => void;
}

interface ItemDrawerProviderProps {
  children: React.ReactNode;
}

const ItemDrawerContext = createContext<ItemDrawerContextValue | null>(null);

export function useItemDrawer() {
  const context = useContext(ItemDrawerContext);
  if (!context) {
    throw new Error("useItemDrawer must be used within ItemDrawerProvider");
  }
  return context;
}

// Holds the drawer state for server-rendered pages and fetches item details on click.
export function ItemDrawerProvider({ children }: ItemDrawerProviderProps) {
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState<ItemDetailJson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  const openItem = useCallback(async (itemId: string) => {
    // Drop a slower earlier response if the user clicks another card.
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;

    setItem(null);
    setError(null);
    setOpen(true);

    try {
      const response = await fetch(`/api/items/${encodeURIComponent(itemId)}`, {
        signal: controller.signal,
      });
      const result: ItemDetailResponse = await response.json();
      if (result.success) setItem(result.data);
      else setError(result.error);
    } catch {
      if (!controller.signal.aborted) setError("Failed to load item");
    }
  }, []);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) requestRef.current?.abort();
  }

  return (
    <ItemDrawerContext.Provider value={{ openItem }}>
      {children}
      <ItemDrawer
        open={open}
        onOpenChange={handleOpenChange}
        item={item}
        error={error}
        onItemUpdated={setItem}
      />
    </ItemDrawerContext.Provider>
  );
}
