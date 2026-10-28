import Link from "next/link";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-4">
      <Link href="/" className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
          DL
        </span>
        <span className="text-lg font-bold">DevLore</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
