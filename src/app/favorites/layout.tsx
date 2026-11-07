import { AppShell } from "@/components/dashboard/AppShell";

export default function FavoritesLayout({ children }: LayoutProps<"/favorites">) {
  return <AppShell>{children}</AppShell>;
}
