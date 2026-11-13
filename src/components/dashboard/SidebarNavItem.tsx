"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface SidebarNavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  isPro?: boolean;
}

// The shadcn default (accent background only) is barely visible on the dark
// sidebar, so the current page also gets a blue tint and a left accent bar.
const ACTIVE_CLASS =
  "data-active:bg-sidebar-primary/15 data-active:font-semibold data-active:text-sidebar-foreground data-active:shadow-[inset_2px_0_0_var(--sidebar-primary)] data-active:hover:bg-sidebar-primary/20";

export function SidebarNavItem({
  href,
  label,
  icon,
  badge,
  isPro = false,
}: SidebarNavItemProps) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link href={href} />}
        isActive={pathname === href}
        className={ACTIVE_CLASS}
        tooltip={label}
        onClick={() => setOpenMobile(false)}
      >
        {icon}
        <span className="truncate">{label}</span>
        {isPro && (
          <Badge
            variant="outline"
            className="h-4 px-1.5 text-[10px] font-semibold tracking-wider text-sidebar-foreground/60 uppercase group-data-[collapsible=icon]:hidden"
          >
            Pro
          </Badge>
        )}
      </SidebarMenuButton>
      {badge !== undefined && <SidebarMenuBadge>{badge}</SidebarMenuBadge>}
    </SidebarMenuItem>
  );
}
