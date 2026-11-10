"use client";

import { useState } from "react";

import { Checklist } from "@/components/home/Checklist";
import { CtaLink } from "@/components/home/CtaLink";
import { Reveal } from "@/components/home/Reveal";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  getPlanHref,
  getProPrice,
  PLANS,
  YEARLY_SAVINGS_PERCENT,
  type BillingPeriod,
  type HomePlan,
  type PriceDisplay,
} from "@/lib/homepage";
import { cn } from "@/lib/utils";

const FREE_PRICE: PriceDisplay = { amount: "$0", period: "/forever", note: "" };

interface PlanCardProps {
  plan: HomePlan;
  price: PriceDisplay;
  href: string;
}

function PlanCard({ plan, price, href }: PlanCardProps) {
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
      <CtaLink href={href} variant={plan.featured ? "primary" : "outline"} block>
        {plan.cta}
      </CtaLink>
    </Card>
  );
}

// Monthly/yearly switch plus the plan cards whose Pro price it controls.
export function PricingToggle({ isSignedIn }: { isSignedIn: boolean }) {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const yearly = period === "yearly";

  return (
    <>
      <div className="mb-14 flex items-center justify-center gap-3 text-sm">
        <span className={yearly ? "text-zinc-500" : "text-foreground"}>Monthly</span>
        <Switch
          checked={yearly}
          onCheckedChange={(checked) => setPeriod(checked ? "yearly" : "monthly")}
          aria-label="Bill yearly"
          className="after:-inset-y-3 data-checked:bg-home-accent"
        />
        <span className={yearly ? "text-foreground" : "text-zinc-500"}>
          Yearly
          <span className="ml-1.5 rounded-full bg-emerald-500/14 px-2 py-0.5 text-[11px] font-semibold text-emerald-500">
            Save {YEARLY_SAVINGS_PERCENT}%
          </span>
        </span>
      </div>

      <div className="mx-auto grid max-w-[784px] gap-6 md:grid-cols-2">
        {PLANS.map((plan) => (
          <Reveal key={plan.id}>
            <PlanCard
              plan={plan}
              price={plan.id === "pro" ? getProPrice(period) : FREE_PRICE}
              href={getPlanHref(isSignedIn, plan.id)}
            />
          </Reveal>
        ))}
      </div>
    </>
  );
}
