import { loadPlanAccess } from "@/components/billing/load-plan-access";
import { PlanAccessProvider } from "@/components/billing/PlanAccessContext";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { ItemDrawerProvider } from "@/components/items/ItemDrawerProvider";
import { EditorPreferencesProvider } from "@/components/settings/EditorPreferencesContext";
import { loadEditorPreferences } from "@/components/settings/load-editor-preferences";
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
        {/* Not awaited: code editors read it with use() once it streams in. */}
        <EditorPreferencesProvider preferencesPromise={loadEditorPreferences()}>
          {/* Not awaited either: only the New Item dialog's type picker reads it. */}
          <PlanAccessProvider planAccessPromise={loadPlanAccess()}>
            {/* Wraps the top bar too, so the command palette can open items. */}
            <ItemDrawerProvider>
              <TopBar />
              <div className="relative flex min-h-0 flex-1">
                <AppSidebar />
                <SidebarInset className="min-w-0 overflow-y-auto p-6">
                  {children}
                </SidebarInset>
              </div>
            </ItemDrawerProvider>
          </PlanAccessProvider>
        </EditorPreferencesProvider>
      </SidebarProvider>
    </TooltipProvider>
  );
}
