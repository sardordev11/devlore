"use client";

import { StarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  useFavoriteToggle,
  type FavoriteTarget,
} from "@/hooks/use-favorite-toggle";
import { TOUCH_ICON_BUTTON } from "@/lib/touch-target";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  target: FavoriteTarget;
  id: string;
  isFavorite: boolean;
  // "label" shows the word "Favorite" next to the star (item drawer).
  variant?: "icon" | "label";
  size?: "icon" | "icon-sm" | "sm";
  className?: string;
  onChange?: (isFavorite: boolean) => void;
}

// Stops click and key events so a surrounding ItemDrawerTrigger or card link doesn't fire.
export function FavoriteButton({
  target,
  id,
  isFavorite: initialValue,
  variant = "icon",
  size = variant === "label" ? "sm" : "icon",
  className,
  onChange,
}: FavoriteButtonProps) {
  const { isFavorite, toggle } = useFavoriteToggle({
    target,
    id,
    isFavorite: initialValue,
    onChange,
  });
  const label = isFavorite ? "Remove from favorites" : "Add to favorites";

  function handleClick(event: React.MouseEvent) {
    event.stopPropagation();
    void toggle();
  }

  return (
    <Button
      variant="ghost"
      size={size}
      aria-label={variant === "icon" ? label : undefined}
      aria-pressed={isFavorite}
      title={label}
      onClick={handleClick}
      onKeyDown={(event) => event.stopPropagation()}
      className={cn(
        "shrink-0",
        variant === "icon" && TOUCH_ICON_BUTTON,
        isFavorite
          ? "text-yellow-400 hover:text-yellow-400"
          : "text-muted-foreground",
        className,
      )}
    >
      <StarIcon className={cn(isFavorite && "fill-yellow-400")} />
      {variant === "label" && "Favorite"}
    </Button>
  );
}
