"use client";

import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { CreditCardIcon, SparklesIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { getCustomerKey } from "@/actions/billing";
import { Button } from "@/components/ui/button";
import type { BillingPlan } from "@/generated/prisma/client";
import {
  formatKrw,
  isCardWindowClosed,
  PLAN_LABELS,
  PLAN_PERIODS,
} from "@/lib/billing-display";
import { BILLING_PLANS } from "@/lib/billing-plans";
import { cn } from "@/lib/utils";

const PLAN_OPTIONS: BillingPlan[] = ["MONTHLY", "YEARLY"];

interface UpgradeButtonProps {
  // upgrade: choose a plan, register a card and pay the first period.
  // change: register a new card for the current subscription, no charge.
  mode: "upgrade" | "change";
  email: string | null;
}

function getErrorCode(error: unknown) {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" ? code : "";
}

// Opens the Toss card registration window; Toss then redirects to
// /api/billing/confirm (success) or back to /settings/billing (fail)
async function openCardWindow(
  customerKey: string,
  successPath: string,
  email: string | null,
) {
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  if (!clientKey) throw new Error("NEXT_PUBLIC_TOSS_CLIENT_KEY is not set");

  const toss = await loadTossPayments(clientKey);
  const origin = window.location.origin;
  await toss.payment({ customerKey }).requestBillingAuth({
    method: "CARD",
    successUrl: `${origin}${successPath}`,
    failUrl: `${origin}/settings/billing`,
    customerEmail: email,
  });
}

export function UpgradeButton({ mode, email }: UpgradeButtonProps) {
  const [plan, setPlan] = useState<BillingPlan>("MONTHLY");
  const [isPending, startTransition] = useTransition();
  const isUpgrade = mode === "upgrade";

  function handleClick() {
    startTransition(async () => {
      const result = await getCustomerKey();
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const successPath = isUpgrade
        ? `/api/billing/confirm?plan=${plan}`
        : "/api/billing/confirm?mode=change";
      try {
        await openCardWindow(result.data, successPath, email);
      } catch (error) {
        // In the iframe window, closing it rejects instead of redirecting
        if (isCardWindowClosed(getErrorCode(error))) {
          toast("Card registration cancelled");
          return;
        }
        console.error("Toss card window failed:", error);
        toast.error("Couldn't open the card window. Please try again.");
      }
    });
  }

  if (!isUpgrade) {
    return (
      <Button variant="outline" onClick={handleClick} disabled={isPending}>
        <CreditCardIcon data-icon="inline-start" />
        {isPending ? "Opening…" : "Change card"}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        role="radiogroup"
        aria-label="Billing period"
        className="grid gap-3 sm:grid-cols-2"
      >
        {PLAN_OPTIONS.map((option) => {
          const selected = option === plan;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={isPending}
              onClick={() => setPlan(option)}
              className={cn(
                "flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50",
                selected ? "border-blue-500 bg-blue-500/10" : "border-border",
              )}
            >
              <span className="text-sm font-medium">{PLAN_LABELS[option]}</span>
              <span className="text-lg font-semibold">
                {formatKrw(BILLING_PLANS[option].amount)}
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  / {PLAN_PERIODS[option]}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <Button onClick={handleClick} disabled={isPending} className="self-start">
        <SparklesIcon data-icon="inline-start" />
        {isPending ? "Opening…" : "Upgrade to Pro"}
      </Button>
    </div>
  );
}
