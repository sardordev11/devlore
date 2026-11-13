"use client";

import { cancelSubscription } from "@/actions/billing";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface CancelSubscriptionDialogProps {
  // Formatted end of the paid period, when Pro stops
  periodEnd: string;
}

export function CancelSubscriptionDialog({ periodEnd }: CancelSubscriptionDialogProps) {
  return (
    <ConfirmDialog
      trigger={
        <AlertDialogTrigger render={<Button variant="outline" />}>
          Cancel subscription
        </AlertDialogTrigger>
      }
      title="Cancel your Pro subscription?"
      description={
        <>
          You won&apos;t be charged again. You keep Pro until{" "}
          <span className="font-medium text-foreground">{periodEnd}</span>,
          and you can resume any time before then.
        </>
      }
      cancelLabel="Keep Pro"
      confirmLabel="Cancel subscription"
      pendingLabel="Cancelling…"
      onConfirm={cancelSubscription}
      successMessage={`Subscription cancelled. Pro lasts until ${periodEnd}.`}
    />
  );
}
