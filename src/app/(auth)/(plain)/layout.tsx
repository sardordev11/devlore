import Link from "next/link";

import { LogoMark } from "@/components/home/Logo";

export default function PlainAuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-4">
      <Link href="/" className="flex items-center gap-2">
        <LogoMark />
        <span className="text-lg font-bold">DevLore</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
