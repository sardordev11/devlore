"use client";

import { Search } from "lucide-react";
import { useSyncExternalStore } from "react";

import { Kbd } from "@/components/ui/kbd";

interface SearchTriggerProps {
  onClick?: () => void;
}

function subscribe() {
  return () => {};
}

function getIsMac() {
  return /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
}

// The server can't know the platform, so it renders the Mac hint.
function getServerIsMac() {
  return true;
}

// Looks like the top bar's search input, but opens the command palette.
export function SearchTrigger({ onClick }: SearchTriggerProps) {
  const isMac = useSyncExternalStore(subscribe, getIsMac, getServerIsMac);
  const shortcut = isMac ? "⌘ K" : "Ctrl K";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-haspopup="dialog"
      aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
      className="relative flex h-8 w-full items-center rounded-lg border border-input bg-transparent pr-2 pl-8 text-left sm:pr-14 text-sm text-muted-foreground transition-colors outline-none hover:bg-input/30 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default dark:bg-input/30 dark:hover:bg-input/50"
    >
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
      <span className="truncate">
        Search<span className="hidden sm:inline"> items and collections</span>…
      </span>
      <Kbd className="absolute top-1/2 right-2 hidden -translate-y-1/2 sm:inline-flex">
        {shortcut}
      </Kbd>
    </button>
  );
}
