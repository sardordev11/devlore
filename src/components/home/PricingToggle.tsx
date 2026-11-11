"use client";

import { useState } from "react";

import { BillingPeriodSwitch } from "@/components/home/BillingPeriodSwitch";
import { CtaLink } from "@/components/home/CtaLink";
import { FREE_PRICE, PlanCard } from "@/components/home/PlanCard";
import { Reveal } from "@/components/home/Reveal";
import { getPlanHref, getProPrice, PLANS, type BillingPeriod } from "@/lib/homepage";

// Monthly/yearly switch plus the plan cards whose Pro price it controls.
export function PricingToggle({ isSignedIn }: { isSignedIn: boolean }) {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");

  return (
    <>
      <BillingPeriodSwitch period={period} onChange={setPeriod} className="mb-14" />

      <div className="mx-auto grid max-w-[784px] gap-6 md:grid-cols-2">
        {PLANS.map((plan) => (
          <Reveal key={plan.id}>
            <PlanCard
              plan={plan}
              price={plan.id === "pro" ? getProPrice(period) : FREE_PRICE}
              action={
                <CtaLink
                  href={getPlanHref(isSignedIn, plan.id)}
                  variant={plan.featured ? "primary" : "outline"}
                  block
                >
                  {plan.cta}
                </CtaLink>
              }
            />
          </Reveal>
        ))}
      </div>
    </>
  );
}
