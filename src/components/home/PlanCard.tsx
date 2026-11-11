import type { ReactNode } from "react";

import { Checklist } from "@/components/home/Checklist";
import { Card } from "@/components/ui/card";
import type { HomePlan, PriceDisplay } from "@/lib/homepage";
import { cn } from "@/lib/utils";

export const FREE_PRICE: PriceDisplay = { amount: "$0", period: "/forever", note: "" };

interface PlanCardProps {
  plan: HomePlan;
  price: PriceDisplay;
  // The button at the bottom of the card
  action: ReactNode;
}

// Free or Pro plan card, used by the homepage pricing section and /upgrade
export function PlanCard({ plan, price, action }: PlanCardProps) {
  return (
    <Card
      className={cn(
        "relative h-full gap-0 overflow-visible rounded-[14px] border p-8 ring-0",
        plan.featured
          ? "border-home-accent/60 bg-home-surface bg-[radial-gradient(circle_at_50%_0%,rgb(59_130_246/0.16),transparent_60%)] shadow-[0_24px_64px_rgb(59_130_246/0.18)]"
          : "border-white/8 bg-home-surface",
      )}
    >
      {plan.featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-home-gradient px-3 py-1 text-xs font-semibold whitespace-nowrap text-white">
          Most Popular
        </span>
      )}
      <h3 className="text-xl font-semibold">{plan.name}</h3>
      <p className="mt-1.5 text-sm text-zinc-400">{plan.description}</p>
      <p className="mt-6">
        <span className="text-[44px] font-extrabold tracking-tight">{price.amount}</span>
        <span className="ml-1 text-zinc-500">{price.period}</span>
      </p>
      <p className="min-h-[1.6em] text-[13px] text-zinc-500">{price.note}</p>
      <Checklist items={plan.features} className="mt-6 mb-8 flex-1" />
      {action}
    </Card>
  );
}
