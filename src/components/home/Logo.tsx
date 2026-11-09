import { FolderIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function LogoMark({ small = false }: { small?: boolean }) {
  return (
    <FolderIcon
      aria-hidden="true"
      className={cn(
        // Stroke follows the surrounding text color, so it matches the "DevLore" wordmark.
        "shrink-0 fill-home-accent/20",
        small ? "size-5" : "size-7",
      )}
    />
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
