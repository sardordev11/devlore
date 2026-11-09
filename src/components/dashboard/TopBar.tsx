import { StarIcon } from "lucide-react";
import Link from "next/link";

import { CreateCollectionDialog } from "@/components/collections/CreateCollectionDialog";
import { CreateItemDialog } from "@/components/items/CreateItemDialog";
import { LogoMark } from "@/components/home/Logo";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { TOUCH_ICON_BUTTON } from "@/lib/touch-target";

export function TopBar() {
  return (
    <header className="grid h-14 shrink-0 grid-cols-[1fr_minmax(0,28rem)_1fr] items-center gap-4 border-b px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className={`md:hidden ${TOUCH_ICON_BUTTON}`} />
        <Link
          href="/dashboard"
          aria-label="DevLore dashboard"
          className="flex items-center gap-2 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <LogoMark />
          <span className="hidden text-lg font-bold sm:inline">DevLore</span>
        </Link>
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
