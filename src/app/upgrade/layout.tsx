import { AppShell } from "@/components/dashboard/AppShell";

export default function UpgradeLayout({ children }: LayoutProps<"/upgrade">) {
  return <AppShell>{children}</AppShell>;
}
