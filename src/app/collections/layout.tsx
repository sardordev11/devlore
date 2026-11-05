import { AppShell } from "@/components/dashboard/AppShell";

export default function CollectionsLayout({
  children,
}: LayoutProps<"/collections">) {
  return <AppShell>{children}</AppShell>;
}
