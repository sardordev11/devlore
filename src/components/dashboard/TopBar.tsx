import { FolderPlus, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function TopBar() {
  return (
    <header className="grid h-14 shrink-0 grid-cols-[1fr_minmax(0,28rem)_1fr] items-center gap-4 border-b px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <span className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
          DL
        </span>
        <span className="hidden text-lg font-bold sm:inline">DevLore</span>
      </div>
      <div className="relative w-full">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search items..."
          aria-label="Search items"
          className="pr-12 pl-8"
        />
        <Kbd className="absolute top-1/2 right-2 -translate-y-1/2">⌘ K</Kbd>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" aria-label="New Collection">
          <FolderPlus data-icon="inline-start" />
          <span className="hidden lg:inline">New Collection</span>
        </Button>
        <Button aria-label="New Item">
          <Plus data-icon="inline-start" />
          <span className="hidden sm:inline">New Item</span>
        </Button>
      </div>
    </header>
  );
}
