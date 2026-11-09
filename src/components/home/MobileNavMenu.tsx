"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { HomeLink } from "@/lib/homepage";

// Section links for small screens, where the inline nav is hidden.
export function MobileNavMenu({ links }: { links: HomeLink[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open menu"
            className="-mr-2 size-11 text-zinc-400 hover:text-foreground md:hidden"
          />
        }
      >
        <MenuIcon className="size-5" />
      </SheetTrigger>
      <SheetContent side="right" className="bg-home-bg data-[side=right]:w-64">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription className="sr-only">Jump to a section of the page</SheetDescription>
        </SheetHeader>
        <nav aria-label="Mobile" className="flex flex-col px-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex h-11 items-center rounded-md px-3 text-zinc-300 hover:bg-white/6 hover:text-foreground focus-visible:outline-2 focus-visible:outline-home-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
