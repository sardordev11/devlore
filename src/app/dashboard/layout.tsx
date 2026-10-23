import { TopBar } from "@/components/dashboard/TopBar";

export default function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  return (
    <div className="flex h-dvh flex-col">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <aside className="w-64 shrink-0 border-r p-4">
          <h2 className="text-sm font-medium text-muted-foreground">Sidebar</h2>
        </aside>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
