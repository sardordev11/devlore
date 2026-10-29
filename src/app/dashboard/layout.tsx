import { AppShell } from "@/components/dashboard/AppShell";

export default function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  return <AppShell>{children}</AppShell>;
}
