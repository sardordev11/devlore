import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  return (
    <TooltipProvider>
      <SidebarProvider className="h-dvh flex-col">
        <TopBar />
        <div className="relative flex min-h-0 flex-1">
          <AppSidebar />
          <SidebarInset className="min-w-0 overflow-y-auto p-6">
            {children}
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
