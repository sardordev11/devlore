import type {
  BillingPlan,
  SubscriptionStatus,
} from "@/generated/prisma/client";

// What server-side gating needs: the stored plan flag plus current usage
export interface UserPlan {
  isPro: boolean;
  itemCount: number;
  collectionCount: number;
}

export interface BillingOverview {
  plan: BillingPlan;
  status: SubscriptionStatus;
  cardCompany: string | null;
  cardNumber: string | null;
  amount: number;
  currentPeriodEnd: Date;
}

// /settings/billing: the overview plus whether a card is still registered
// (Toss can delete it, and then Resume needs a new card first)
export interface BillingDetails extends BillingOverview {
  hasBillingKey: boolean;
}
