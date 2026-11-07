"use client";

import { PinIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePinToggle } from "@/hooks/use-pin-toggle";
import { cn } from "@/lib/utils";

interface PinButtonProps {
  id: string;
  isPinned: boolean;
  onChange?: (isPinned: boolean) => void;
}

// Labelled Pin toggle for the item drawer; cards keep a static pin indicator.
export function PinButton({
  id,
  isPinned: initialValue,
  onChange,
}: PinButtonProps) {
  const { isPinned, toggle } = usePinToggle({
    id,
    isPinned: initialValue,
    onChange,
  });

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-pressed={isPinned}
      title={isPinned ? "Unpin item" : "Pin item"}
      onClick={() => void toggle()}
      className={cn(!isPinned && "text-muted-foreground")}
    >
      <PinIcon className={cn(isPinned && "fill-current")} />
      {isPinned ? "Pinned" : "Pin"}
    </Button>
  );
}
