import { ArrowLeftIcon, CheckCircle2Icon, CircleAlertIcon, InfoIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { auth } from "@/auth";
import { CancelSubscriptionDialog } from "@/components/billing/CancelSubscriptionDialog";
import { ResumeSubscriptionButton } from "@/components/billing/ResumeSubscriptionButton";
import { UpgradeButton } from "@/components/billing/UpgradeButton";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatKrw,
  getBillingMessage,
  getBillingView,
  PLAN_LABELS,
  PLAN_PERIODS,
  type BillingView,
} from "@/lib/billing-display";
import { getBillingDetails } from "@/lib/db/billing";
import { formatDate } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import type { BillingDetails } from "@/types/billing";

const STATUS_BADGES: Record<BillingView, { label: string; className: string }> = {
  free: { label: "Free", className: "" },
  active: { label: "Active", className: "border-emerald-500/40 text-emerald-400" },
  past_due: { label: "Payment failed", className: "border-red-500/40 text-red-400" },
  canceled: { label: "Cancelled", className: "border-amber-500/40 text-amber-400" },
};

type Banner = { tone: "success" | "neutral" | "error"; text: string };

function getBanner(params: Record<string, string | string[] | undefined>): Banner | null {
  if (params.upgraded === "1") {
    return { tone: "success", text: "Welcome to Pro! Your subscription is active." };
  }
  if (params.card_changed === "1") {
    return { tone: "success", text: "Your card was updated." };
  }
  // Our confirm route sends ?error=, the Toss fail URL sends ?code=
  const code = params.error ?? params.code;
  return typeof code === "string" && code ? getBillingMessage(code) : null;
}

const BANNER_STYLES = {
  success: { icon: CheckCircle2Icon, className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
  neutral: { icon: InfoIcon, className: "border-border bg-muted text-muted-foreground" },
  error: { icon: CircleAlertIcon, className: "border-red-500/30 bg-red-500/10 text-red-300" },
};

function BillingBanner({ banner }: { banner: Banner }) {
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

function getSummary(view: BillingView, details: BillingDetails | null) {
  if (!details || view === "free") {
    return "50 items, 3 collections and every type except File and Image.";
  }
  const periodEnd = formatDate(details.currentPeriodEnd, "long");
  const price = `${formatKrw(details.amount)} / ${PLAN_PERIODS[details.plan]}`;
  if (view === "active") return `Renews on ${periodEnd} for ${price}.`;
  if (view === "past_due") {
    return `Your last renewal failed. We'll retry daily; update your card to keep Pro after ${periodEnd}.`;
  }
  return details.hasBillingKey
    ? `Pro until ${periodEnd}. You won't be charged again unless you resume.`
    : `Pro until ${periodEnd}. Your card was removed, so add one before resuming.`;
}

function BillingActions({
  view,
  details,
  email,
}: {
  view: BillingView;
  details: BillingDetails | null;
  email: string | null;
}) {
  if (!details || view === "free") return <UpgradeButton mode="upgrade" email={email} />;

  const periodEnd = formatDate(details.currentPeriodEnd, "long");
  return (
    <div className="flex flex-wrap gap-2">
      {view === "canceled" && details.hasBillingKey && <ResumeSubscriptionButton />}
      <UpgradeButton mode="change" email={email} />
      {view !== "canceled" && <CancelSubscriptionDialog periodEnd={periodEnd} />}
    </div>
  );
}

export default async function BillingPage({ searchParams }: PageProps<"/settings/billing">) {
  // User data must be fetched per request, not prerendered at build time.
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/settings/billing");

  const [details, params] = await Promise.all([
    getBillingDetails(session.user.id),
    searchParams,
  ]);
  const view = getBillingView(details, new Date());
  const banner = getBanner(params);
  const badge = STATUS_BADGES[view];
  // The subscription while it still gives Pro; null on the Free plan
  const paid = view === "free" ? null : details;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
      <header>
        <Link
          href="/settings"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3.5" aria-hidden />
          Settings
        </Link>
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="mt-1 text-muted-foreground">Manage your plan and payment card</p>
      </header>

      {banner && <BillingBanner banner={banner} />}

      <DashboardSection title="Plan">
        <Card>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-semibold">
                  {paid ? `Pro (${PLAN_LABELS[paid.plan]})` : "Free"}
                </p>
                {paid && (
                  <Badge variant="outline" className={badge.className}>
                    {badge.label}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{getSummary(view, details)}</p>
            </div>

            {paid?.cardNumber && (
              <div className="text-sm">
                <p className="font-medium">Payment card</p>
                <p className="text-muted-foreground">
                  {[paid.cardCompany, paid.cardNumber].filter(Boolean).join(" · ")}
                </p>
              </div>
            )}

            <BillingActions view={view} details={details} email={session.user.email ?? null} />
          </CardContent>
        </Card>
      </DashboardSection>
    </div>
  );
}
