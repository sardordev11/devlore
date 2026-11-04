"use client";

import { DownloadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface FileDownloadButtonProps {
  itemId: string;
  fileName: string;
}

// Stops click and key events so a surrounding ItemDrawerTrigger doesn't open the drawer.
export function FileDownloadButton({ itemId, fileName }: FileDownloadButtonProps) {
  function stopPropagation(event: React.SyntheticEvent) {
    event.stopPropagation();
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      nativeButton={false}
      aria-label={`Download ${fileName}`}
      title="Download"
      onClick={stopPropagation}
      onKeyDown={stopPropagation}
      render={<a href={`/api/items/${itemId}/download`} download />}
    >
      <DownloadIcon />
    </Button>
  );
}
