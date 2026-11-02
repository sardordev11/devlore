import { AppShell } from "@/components/dashboard/AppShell";

export default function ItemsLayout({ children }: LayoutProps<"/items">) {
  return <AppShell>{children}</AppShell>;
}
