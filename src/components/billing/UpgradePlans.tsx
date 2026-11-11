"use client";

import { useState } from "react";

import { BillingPeriodSwitch } from "@/components/home/BillingPeriodSwitch";
import { getCtaClassName } from "@/components/home/CtaLink";
import { FREE_PRICE, PlanCard } from "@/components/home/PlanCard";
import { Button } from "@/components/ui/button";
import { useCardWindow } from "@/hooks/use-card-window";
import { formatKrw, toBillingPlan, UPGRADE_PATH } from "@/lib/billing-display";
import { BILLING_PLANS } from "@/lib/billing-plans";
import { getProPrice, PLANS, type BillingPeriod } from "@/lib/homepage";

interface UpgradePlansProps {
  email: string | null;
}

// Free and Pro cards with the monthly/yearly switch; the Pro button opens the
// Toss card window for the chosen period
export function UpgradePlans({ email }: UpgradePlansProps) {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const { open, isPending } = useCardWindow();

  function handleUpgrade() {
    open({
      successPath: `/api/billing/confirm?plan=${toBillingPlan(period)}`,
      failPath: UPGRADE_PATH,
      email,
    });
  }

  return (
    <div className="flex flex-col">
      <BillingPeriodSwitch
        period={period}
        onChange={setPeriod}
        disabled={isPending}
        className="mb-12"
      />

      <div className="mx-auto grid w-full max-w-[784px] gap-6 md:grid-cols-2">
        {PLANS.map((plan) => {
          const isPro = plan.id === "pro";
          return (
            <PlanCard
              key={plan.id}
              plan={plan}
              price={isPro ? getProPrice(period) : FREE_PRICE}
              action={
                isPro ? (
                  <Button
                    onClick={handleUpgrade}
                    disabled={isPending}
                    className={getCtaClassName({ block: true })}
                  >
                    {isPending ? "Opening checkout…" : plan.cta}
                  </Button>
                ) : (
                  <Button
                    disabled
                    variant="outline"
                    className={getCtaClassName({ variant: "outline", block: true })}
                  >
                    Current plan
                  </Button>
                )
              }
            />
          );
        })}
      </div>

      <p className="mx-auto mt-8 max-w-[784px] text-center text-xs text-muted-foreground">
        Payments are processed by Toss Payments and charged in Korean won:{" "}
        {formatKrw(BILLING_PLANS.MONTHLY.amount)}/month or{" "}
        {formatKrw(BILLING_PLANS.YEARLY.amount)}/year. Cancel anytime from Billing.
      </p>
    </div>
  );
}
