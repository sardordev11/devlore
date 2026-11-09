"use client";

import { CHAOS_ICONS } from "@/components/home/chaos-icons";
import { useChaosAnimation } from "@/hooks/use-chaos-animation";
import { cn } from "@/lib/utils";

// Scattered tool icons drifting around a dashed box ("your knowledge today").
export function ChaosVisual() {
  const { containerRef, setIconRef } = useChaosAnimation();

  return (
    <div
      ref={containerRef}
      className="group/chaos relative h-70 overflow-hidden rounded-[14px] border border-dashed border-white/14 bg-home-surface bg-[radial-gradient(circle_at_70%_80%,rgb(245_158_11/0.06),transparent_60%)] md:h-80"
    >
      {CHAOS_ICONS.map(({ name, icon: Icon, className }, index) => (
        <div
          key={name}
          ref={setIconRef(index)}
          title={name}
          className="absolute top-0 left-0 grid size-14 place-items-center rounded-[14px] border border-white/14 bg-home-surface-2 opacity-0 shadow-[0_8px_24px_rgb(0_0_0/0.45)] transition-opacity duration-500 will-change-transform group-data-ready/chaos:opacity-100"
        >
          <Icon aria-hidden className={cn("size-7", className)} />
        </div>
      ))}
    </div>
  );
}
