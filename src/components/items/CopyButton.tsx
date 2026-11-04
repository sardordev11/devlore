"use client";

import { CopyIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  size?: "icon" | "icon-sm";
  className?: string;
}

// Stops click and key events so a surrounding ItemDrawerTrigger doesn't open the drawer.
export function CopyButton({
  value,
  size = "icon",
  className,
}: CopyButtonProps) {
  async function handleClick(event: React.MouseEvent) {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  }

  return (
    <Button
      variant="ghost"
      size={size}
      aria-label="Copy to clipboard"
      title="Copy"
      onClick={handleClick}
      onKeyDown={(event) => event.stopPropagation()}
      className={cn("shrink-0 text-muted-foreground", className)}
    >
      <CopyIcon />
    </Button>
  );
}
