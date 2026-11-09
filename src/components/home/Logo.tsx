import Link from "next/link";

import { cn } from "@/lib/utils";

export function LogoMark({ small = false }: { small?: boolean }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center bg-home-gradient font-extrabold tracking-wide text-white",
        small ? "size-5.5 rounded-md text-[9px]" : "size-7.5 rounded-lg text-xs",
      )}
    >
      DL
    </span>
  );
}

// "compact" hides the wordmark on very narrow screens (the nav needs the room).
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="DevLore home"
      className="inline-flex shrink-0 items-center gap-2.5 rounded-md text-[17px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-home-accent"
    >
      <LogoMark />
      <span className={cn(compact && "max-[399px]:hidden")}>DevLore</span>
    </Link>
  );
}
