import { StarIcon } from "lucide-react";
import Link from "next/link";

import { CreateCollectionDialog } from "@/components/collections/CreateCollectionDialog";
import { CreateItemDialog } from "@/components/items/CreateItemDialog";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { Button } from "@/components/ui/button";
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
      <GlobalSearch />
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          nativeButton={false}
          aria-label="Favorites"
          title="Favorites"
          render={<Link href="/favorites" />}
        >
          <StarIcon />
        </Button>
        <CreateCollectionDialog />
        <CreateItemDialog />
      </div>
    </header>
  );
}
