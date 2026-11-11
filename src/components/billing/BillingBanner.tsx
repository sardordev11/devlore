import { CheckCircle2Icon, CircleAlertIcon, InfoIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type Banner = { tone: "success" | "neutral" | "error"; text: string };

const BANNER_STYLES = {
  success: { icon: CheckCircle2Icon, className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
  neutral: { icon: InfoIcon, className: "border-border bg-muted text-muted-foreground" },
  error: { icon: CircleAlertIcon, className: "border-red-500/30 bg-red-500/10 text-red-300" },
};

export function BillingBanner({ banner }: { banner: Banner }) {
  const { icon: Icon, className } = BANNER_STYLES[banner.tone];
  return (
    <div
      role={banner.tone === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-2 rounded-lg border px-4 py-3 text-sm", className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      {banner.text}
    </div>
  );
}
