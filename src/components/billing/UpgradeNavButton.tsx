"use client";

import { SparklesIcon } from "lucide-react";
import Link from "next/link";

import { usePlanAccess } from "@/components/billing/PlanAccessContext";
import { Button } from "@/components/ui/button";
import { UPGRADE_PATH } from "@/lib/billing-display";

// Top bar link to /upgrade, only for users without Pro. Ghost and muted so it
// sits quieter than New Collection / New Item.
export function UpgradeNavButton() {
  const { isPro } = usePlanAccess();
  if (isPro) return null;

  return (
    <Button
      variant="ghost"
      nativeButton={false}
      aria-label="Upgrade to Pro"
      title="Upgrade to Pro"
      render={<Link href={UPGRADE_PATH} />}
      className="text-muted-foreground hover:text-foreground"
    >
      <SparklesIcon data-icon="inline-start" className="text-blue-400" aria-hidden />
      <span className="hidden sm:inline">Upgrade</span>
    </Button>
  );
}
