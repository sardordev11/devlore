"use client";

import { Switch } from "@/components/ui/switch";
import { YEARLY_SAVINGS_PERCENT, type BillingPeriod } from "@/lib/homepage";
import { cn } from "@/lib/utils";

interface BillingPeriodSwitchProps {
  period: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
  disabled?: boolean;
  className?: string;
}

// Monthly / Yearly switch with the yearly savings badge
export function BillingPeriodSwitch({
  period,
  onChange,
  disabled,
  className,
}: BillingPeriodSwitchProps) {
  const yearly = period === "yearly";

  return (
    <div className={cn("flex items-center justify-center gap-3 text-sm", className)}>
      <span className={yearly ? "text-zinc-500" : "text-foreground"}>Monthly</span>
      <Switch
        checked={yearly}
        onCheckedChange={(checked) => onChange(checked ? "yearly" : "monthly")}
        disabled={disabled}
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
  );
}
