import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/auth";
import { confirmCardChange, confirmUpgrade } from "@/lib/billing-confirm";
import { parseBillingPlan } from "@/lib/billing-plans";
import { getOrCreateCustomerKey } from "@/lib/db/billing";
import { checkRateLimit } from "@/lib/rate-limit";

const BILLING_PATH = "/settings/billing";

function back(request: NextRequest, query: string) {
  return NextResponse.redirect(
    new URL(`${BILLING_PATH}?${query}`, request.nextUrl.origin),
  );
}

// Toss success URL: the card window redirects here with authKey and
// customerKey. ?plan=MONTHLY|YEARLY upgrades; ?mode=change replaces the card.
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    const signIn = new URL("/sign-in", request.nextUrl.origin);
    signIn.searchParams.set("callbackUrl", BILLING_PATH);
    return NextResponse.redirect(signIn);
  }
  const userId = session.user.id;

  const params = request.nextUrl.searchParams;
  const authKey = params.get("authKey");
  const isCardChange = params.get("mode") === "change";
  const plan = parseBillingPlan(params.get("plan"));
  if (!authKey || (!isCardChange && !plan)) return back(request, "error=invalid");

  const limit = await checkRateLimit("billing", userId);
  if (!limit.success) return back(request, "error=rate_limited");

  try {
    // Never trust the customerKey in the URL: it must be this user's
    const customerKey = await getOrCreateCustomerKey(userId);
    if (params.get("customerKey") !== customerKey) {
      return back(request, "error=invalid");
    }

    const outcome = isCardChange
      ? await confirmCardChange({ userId, authKey, customerKey })
      : await confirmUpgrade({
          userId,
          email: session.user.email ?? null,
          plan: plan!,
          authKey,
          customerKey,
          now: new Date(),
        });
    return back(request, outcome);
  } catch (error) {
    console.error("Billing confirm failed:", error);
    return back(request, "error=server");
  }
}
