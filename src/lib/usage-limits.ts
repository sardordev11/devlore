import type { UserPlan } from "@/types/billing";

// Pure module (no Prisma, no server-only) so client components can show hints.
// Limits apply only when the flag is exactly "true"; unset keeps everything open.
export const ENFORCE_PLAN_LIMITS = process.env.ENFORCE_PLAN_LIMITS === "true";

export const FREE_LIMITS = { items: 50, collections: 3 } as const;

export const PRO_ONLY_TYPE_SLUGS = ["files", "images"] as const;

export type ProOnlyTypeSlug = (typeof PRO_ONLY_TYPE_SLUGS)[number];

export function isProOnlyTypeSlug(slug: string): slug is ProOnlyTypeSlug {
  return (PRO_ONLY_TYPE_SLUGS as readonly string[]).includes(slug);
}

export function canUsePro(user: { isPro: boolean }) {
  return !ENFORCE_PLAN_LIMITS || user.isPro;
}

export function isWithinLimit(count: number, limit: number, isPro: boolean) {
  return canUsePro({ isPro }) || count < limit;
}

export function canCreateItem(plan: UserPlan) {
  return isWithinLimit(plan.itemCount, FREE_LIMITS.items, plan.isPro);
}

export function canCreateCollection(plan: UserPlan) {
  return isWithinLimit(plan.collectionCount, FREE_LIMITS.collections, plan.isPro);
}

export function canUseTypeSlug(plan: UserPlan, slug: string) {
  return !isProOnlyTypeSlug(slug) || canUsePro(plan);
}

export const UPGRADE_MESSAGES = {
  items: `Free accounts can have up to ${FREE_LIMITS.items} items. Upgrade to Pro for unlimited items.`,
  collections: `Free accounts can have up to ${FREE_LIMITS.collections} collections. Upgrade to Pro for unlimited collections.`,
  fileTypes: "File and image uploads are a Pro feature. Upgrade to Pro to upload files.",
  ai: "AI features are part of Pro. Upgrade to Pro to use them.",
} as const;
