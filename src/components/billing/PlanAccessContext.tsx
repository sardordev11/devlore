"use client";

import { createContext, use, useContext } from "react";

import type { PlanAccess } from "@/components/billing/load-plan-access";

const PlanAccessContext = createContext<Promise<PlanAccess> | null>(null);

interface PlanAccessProviderProps {
  // Started on the server and streamed in, so the shell doesn't wait for it
  planAccessPromise: Promise<PlanAccess>;
  children: React.ReactNode;
}

export function PlanAccessProvider({
  planAccessPromise,
  children,
}: PlanAccessProviderProps) {
  return <PlanAccessContext value={planAccessPromise}>{children}</PlanAccessContext>;
}

// Suspends until the plan arrives; everything stays unlocked outside a provider
export function usePlanAccess(): PlanAccess {
  const promise = useContext(PlanAccessContext);
  return promise ? use(promise) : { proLocked: false };
}
