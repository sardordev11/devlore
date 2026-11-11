import "server-only";

import { connection } from "next/server";

import { auth } from "@/auth";
import { canUsePro } from "@/lib/usage-limits";

export interface PlanAccess {
  // Pro plan (subscription active or still paid for); drives the Upgrade button
  isPro: boolean;
  // Pro-only types (File, Image) are locked: limits enforced and not Pro
  proLocked: boolean;
}

// For UI hints only. ENFORCE_PLAN_LIMITS isn't exposed to the browser, so the
// server works it out; the actions and /api/upload still check for themselves.
export async function loadPlanAccess(): Promise<PlanAccess> {
  await connection();
  const session = await auth();
  const isPro = session?.user?.isPro ?? false;
  return { isPro, proLocked: !canUsePro({ isPro }) };
}
