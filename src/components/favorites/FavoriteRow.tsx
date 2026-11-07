import type { LucideIcon } from "lucide-react";
import { createElement } from "react";

import { RelativeTime } from "@/components/favorites/RelativeTime";

interface FavoriteRowProps {
  icon: LucideIcon;
  color: string;
  title: string;
  badge: string;
  // ISO date string.
  date: string;
}

// One dense, monospace row shared by favorite items and collections.
export function FavoriteRow({ icon, color, title, badge, date }: FavoriteRowProps) {
  return (
    <div className="flex items-center gap-3 px-2 py-1.5 font-mono text-sm transition-colors hover:bg-muted/50">
      {createElement(icon, {
        className: "size-4 shrink-0",
        // Type colors are dynamic hex values from the database.
        style: { color },
      })}
      <span className="min-w-0 flex-1 truncate">{title}</span>
      <span
        className="hidden shrink-0 rounded-sm border px-1.5 text-[11px] leading-5 sm:inline"
        // Same dynamic type color; "4d" is ~30% alpha for a subtle border.
        style={{ color, borderColor: `${color}4d` }}
      >
        {badge}
      </span>
      <RelativeTime
        date={date}
        className="w-32 shrink-0 text-right text-xs text-muted-foreground"
      />
    </div>
  );
}
