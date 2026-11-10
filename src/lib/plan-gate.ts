import "server-only";

import { getUserPlan } from "@/lib/db/billing";
import {
  canCreateCollection,
  canCreateItem,
  canUsePro,
  canUseTypeSlug,
  ENFORCE_PLAN_LIMITS,
  isProOnlyTypeSlug,
  UPGRADE_MESSAGES,
} from "@/lib/usage-limits";
import type { UserPlan } from "@/types/billing";

// Server-side plan checks. Each returns the upgrade message when the user is
// over a free limit, or null when the action may go ahead. With the flag off
// they return null without touching the database. The plan comes from
// getUserPlan, never session.user.isPro, which can be out of date.

const NO_PLAN: UserPlan = { isPro: false, itemCount: 0, collectionCount: 0 };

async function loadPlan(userId: string): Promise<UserPlan> {
  return (await getUserPlan(userId)) ?? NO_PLAN;
}

export async function checkItemLimit(
  userId: string,
  typeSlug: string,
): Promise<string | null> {
  if (!ENFORCE_PLAN_LIMITS) return null;
  const plan = await loadPlan(userId);
  if (!canUseTypeSlug(plan, typeSlug)) return UPGRADE_MESSAGES.fileTypes;
  if (!canCreateItem(plan)) return UPGRADE_MESSAGES.items;
  return null;
}

export async function checkCollectionLimit(userId: string): Promise<string | null> {
  if (!ENFORCE_PLAN_LIMITS) return null;
  const plan = await loadPlan(userId);
  return canCreateCollection(plan) ? null : UPGRADE_MESSAGES.collections;
}

// Whether the user may open /items/[slug]. Only Pro-only types read the plan.
export async function canViewTypeSlug(userId: string, slug: string): Promise<boolean> {
  if (!ENFORCE_PLAN_LIMITS || !isProOnlyTypeSlug(slug)) return true;
  return canUseTypeSlug(await loadPlan(userId), slug);
}

export async function checkUploadAccess(userId: string): Promise<string | null> {
  if (!ENFORCE_PLAN_LIMITS) return null;
  const plan = await loadPlan(userId);
  return canUsePro(plan) ? null : UPGRADE_MESSAGES.fileTypes;
}
