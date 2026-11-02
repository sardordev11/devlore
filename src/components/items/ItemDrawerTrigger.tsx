"use client";

import { useItemDrawer } from "@/components/items/ItemDrawerProvider";

interface ItemDrawerTriggerProps {
  itemId: string;
  children: React.ReactNode;
}

// A div with button semantics, since the card's block content isn't valid inside <button>.
export function ItemDrawerTrigger({
  itemId,
  children,
}: ItemDrawerTriggerProps) {
  const { openItem } = useItemDrawer();

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openItem(itemId);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-haspopup="dialog"
      onClick={() => openItem(itemId)}
      onKeyDown={handleKeyDown}
      className="cursor-pointer rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {children}
    </div>
  );
}
