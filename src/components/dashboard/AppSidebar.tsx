import { Suspense } from "react";

import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { SidebarUser } from "@/components/dashboard/SidebarUser";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { currentUser } from "@/lib/mock-data";

// Fixed widths: SidebarMenuSkeleton's random width can't be prerendered.
const SKELETON_WIDTHS = ["w-3/5", "w-1/2", "w-3/4", "w-2/5", "w-3/5", "w-1/2", "w-2/3"];

function SidebarNavSkeleton() {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {SKELETON_WIDTHS.map((width, i) => (
          <SidebarMenuItem key={i} className="flex h-8 items-center gap-2 px-2">
            <Skeleton className="size-4 rounded-md" />
            <Skeleton className={`h-4 ${width} group-data-[collapsible=icon]:hidden`} />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  return (
    // Positioned inside the area below the top bar instead of the full viewport height.
    <Sidebar collapsible="icon" className="absolute h-full">
      <SidebarHeader className="h-12 flex-row items-center justify-between border-b border-sidebar-border group-data-[collapsible=icon]:justify-center">
        <span className="px-2 text-sm font-medium text-muted-foreground group-data-[collapsible=icon]:hidden">
          Navigation
        </span>
        <SidebarTrigger className="text-muted-foreground" />
      </SidebarHeader>

      <SidebarContent>
        <Suspense fallback={<SidebarNavSkeleton />}>
          <SidebarNav />
        </Suspense>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarUser user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
