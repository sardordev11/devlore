import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { auth } from "@/auth";
import { BillingBanner } from "@/components/billing/BillingBanner";
import { UpgradePlans } from "@/components/billing/UpgradePlans";
import { getBillingMessage, getBillingView, UPGRADE_PATH } from "@/lib/billing-display";
import { getBillingDetails } from "@/lib/db/billing";

export const metadata: Metadata = { title: "Upgrade to Pro · DevLore" };

export default async function UpgradePage({ searchParams }: PageProps<"/upgrade">) {
  // User data must be fetched per request, not prerendered at build time.
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect(`/sign-in?callbackUrl=${UPGRADE_PATH}`);

  const [details, params] = await Promise.all([
    getBillingDetails(session.user.id),
    searchParams,
  ]);
  // Anyone still on a paid period manages it from Billing instead
  if (getBillingView(details, new Date()) !== "free") redirect("/settings/billing");

  // The Toss fail URL comes back here with ?code=
  const banner = typeof params.code === "string" && params.code
    ? getBillingMessage(params.code)
    : null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 py-4">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Upgrade to Pro</h1>
        <p className="mt-2 text-muted-foreground">
          Unlimited items and collections, file uploads and AI features.
        </p>
      </header>

      {banner && <BillingBanner banner={banner} />}

      <UpgradePlans email={session.user.email ?? null} />
    </div>
  );
}
