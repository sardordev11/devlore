import { AppShell } from "@/components/dashboard/AppShell";

export default function ProfileLayout({ children }: LayoutProps<"/profile">) {
  return <AppShell>{children}</AppShell>;
}
