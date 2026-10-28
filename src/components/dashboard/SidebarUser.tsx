"use client";

import Link from "next/link";
import { ChevronsUpDownIcon, LogOutIcon, UserIcon } from "lucide-react";

import { signOutUser } from "@/actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { UserAvatar } from "@/components/user/UserAvatar";

interface SidebarUserProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function SidebarUser({ user }: SidebarUserProps) {
  const { isMobile, state, setOpenMobile } = useSidebar();
  const displayName = user.name || user.email || "User";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                aria-label="Account menu"
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
              />
            }
          >
            <UserAvatar {...user} />
            <div className="grid flex-1 leading-tight">
              <span className="truncate font-medium">{displayName}</span>
              {user.email && (
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              )}
            </div>
            <ChevronsUpDownIcon className="text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={state === "collapsed" && !isMobile ? "right" : "top"}
            align="end"
            sideOffset={8}
            className="min-w-56"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center gap-2 py-1.5 text-sm font-normal text-foreground">
                <UserAvatar {...user} />
                <div className="grid min-w-0 flex-1 leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  {user.email && (
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  )}
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              render={<Link href="/profile" />}
              onClick={() => setOpenMobile(false)}
            >
              <UserIcon />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => signOutUser()}>
              <LogOutIcon />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
