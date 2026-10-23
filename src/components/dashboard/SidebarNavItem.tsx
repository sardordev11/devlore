"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
}

export function SidebarNavItem({ href, label, icon, badge }: SidebarNavItemProps) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link href={href} />}
        isActive={pathname === href}
        tooltip={label}
        onClick={() => setOpenMobile(false)}
      >
        {icon}
        <span>{label}</span>
      </SidebarMenuButton>
      {badge !== undefined && <SidebarMenuBadge>{badge}</SidebarMenuBadge>}
    </SidebarMenuItem>
  );
}
