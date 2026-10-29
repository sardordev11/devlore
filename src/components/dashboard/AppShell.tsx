import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

interface AppShellProps {
  children: React.ReactNode;
}

// Top bar, sidebar and scrollable main area shared by signed-in pages.
export function AppShell({ children }: AppShellProps) {
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
