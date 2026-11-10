import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      // For UI only; server-side gating reads the plan with getUserPlan
      isPro: boolean;
    } & DefaultSession["user"];
  }
}

// next-auth/jwt only re-exports this module, so the augmentation goes here
declare module "@auth/core/jwt" {
  interface JWT {
    isPro?: boolean;
  }
}
