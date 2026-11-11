"use client";

import { CreditCardIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCardWindow } from "@/hooks/use-card-window";

const BILLING_PATH = "/settings/billing";

// Registers a new card for the current subscription, with no charge
export function ChangeCardButton({ email }: { email: string | null }) {
  const { open, isPending } = useCardWindow();

  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() =>
        open({
          successPath: "/api/billing/confirm?mode=change",
          failPath: BILLING_PATH,
          email,
        })
      }
    >
      <CreditCardIcon data-icon="inline-start" />
      {isPending ? "Opening…" : "Change card"}
    </Button>
  );
}
