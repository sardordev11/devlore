import { LogoMark } from "@/components/home/Logo";
import { HOME_TYPES, PREVIEW_CARDS, PREVIEW_SIDEBAR_TYPES } from "@/lib/homepage";
import { getTypeIcon } from "@/lib/type-icons";
import { cn } from "@/lib/utils";

// A miniature, non-interactive DevLore dashboard ("...with DevLore").
export function DashboardPreview() {
  return (
    <div
      role="img"
      aria-label="DevLore dashboard preview"
      className="flex h-70 overflow-hidden rounded-[14px] border border-white/14 bg-home-surface shadow-[0_24px_64px_rgb(0_0_0/0.5),0_0_0_1px_rgb(59_130_246/0.08)] md:h-80"
    >
      <div className="flex w-[30%] min-w-24 flex-col gap-1.5 border-r border-white/8 bg-home-bg-alt px-2.5 py-3">
        <div className="mb-2">
          <LogoMark small />
        </div>
        {PREVIEW_SIDEBAR_TYPES.map((key, index) => {
          const type = HOME_TYPES[key];
          const Icon = getTypeIcon(type.icon);
          return (
            <span
              key={key}
              className={cn(
                "flex items-center gap-2 truncate rounded-md px-1.5 py-1 text-[11px] text-zinc-400",
                index === 0 && "bg-white/5 text-foreground",
              )}
            >
              <Icon aria-hidden className="size-3 shrink-0" style={{ color: type.color }} />
              {type.label}
            </span>
          );
        })}
      </div>
      <div className="min-w-0 flex-1 p-3">
        <div className="mb-3 rounded-[7px] border border-white/8 bg-home-surface-2 px-2.5 py-1.5 text-[11px] text-zinc-500">
          Search…
        </div>
        <div className="grid grid-cols-2 gap-2">
          {PREVIEW_CARDS.map((card) => {
            const type = HOME_TYPES[card.type];
            const Icon = getTypeIcon(type.icon);
            return (
              <div
                key={card.title}
                className="flex flex-col gap-1.5 rounded-lg border border-t-3 border-white/8 bg-home-surface-2 p-2.5"
                style={{ borderTopColor: type.color }}
              >
                <span className="flex items-center gap-1.5 truncate text-[11px] font-semibold">
                  <Icon aria-hidden className="size-3 shrink-0" style={{ color: type.color }} />
                  {card.title}
                </span>
                <span className="block h-1.25 rounded-full bg-white/8" />
                <span className="block h-1.25 w-3/5 rounded-full bg-white/8" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
