import Link from "next/link";

import { cn } from "@/lib/utils";

// Code brackets around an open book ("dev" + "lore"), in the accent blue used by the
// "Get Started" button; src/app/icon.svg mirrors it.
export function LogoMark({ small = false }: { small?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("shrink-0 text-home-accent", small ? "size-5" : "size-7")}
    >
      <path d="M4.5 4H4a1.5 1.5 0 0 0-1.5 1.5V11l-1 1 1 1v5.5A1.5 1.5 0 0 0 4 20h.5" />
      <path d="M19.5 4h.5a1.5 1.5 0 0 1 1.5 1.5V11l1 1-1 1v5.5a1.5 1.5 0 0 1-1.5 1.5h-.5" />
      <path
        className="fill-home-accent/20"
        d="M12 7.5c-1.4-.9-2.9-1.4-4.5-1.5v10.5c1.6.1 3.1.6 4.5 1.5 1.4-.9 2.9-1.4 4.5-1.5V6c-1.6.1-3.1.6-4.5 1.5z"
      />
      <path d="M12 7.5V18" />
    </svg>
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
