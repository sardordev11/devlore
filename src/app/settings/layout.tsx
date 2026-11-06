import { AppShell } from "@/components/dashboard/AppShell";

export default function SettingsLayout({ children }: LayoutProps<"/settings">) {
  return <AppShell>{children}</AppShell>;
}
