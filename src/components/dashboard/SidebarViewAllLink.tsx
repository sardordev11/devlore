"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface SidebarViewAllLinkProps {
  href: string;
  label: string;
}

// Small text link under a sidebar group, highlighted on its own page.
export function SidebarViewAllLink({ href, label }: SidebarViewAllLinkProps) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      onClick={() => setOpenMobile(false)}
      className={cn(
        "block rounded-md px-2 py-1.5 text-xs font-medium transition-colors group-data-[collapsible=icon]:hidden hover:text-sidebar-foreground",
        isActive
          ? "bg-sidebar-primary/15 text-sidebar-foreground"
          : "text-sidebar-foreground/70",
      )}
    >
      {label}
    </Link>
  );
}
