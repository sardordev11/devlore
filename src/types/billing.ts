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
