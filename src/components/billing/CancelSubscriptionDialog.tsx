"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { cancelSubscription } from "@/actions/billing";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface CancelSubscriptionDialogProps {
  // Formatted end of the paid period, when Pro stops
  periodEnd: string;
}

export function CancelSubscriptionDialog({ periodEnd }: CancelSubscriptionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) return;
    setOpen(nextOpen);
  }

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelSubscription();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setOpen(false);
      toast.success(`Subscription cancelled. Pro lasts until ${periodEnd}.`);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger render={<Button variant="outline" />}>
        Cancel subscription
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel your Pro subscription?</AlertDialogTitle>
          <AlertDialogDescription>
            You won&apos;t be charged again. You keep Pro until{" "}
            <span className="font-medium text-foreground">{periodEnd}</span>,
            and you can resume any time before then.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Keep Pro</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleCancel}
            disabled={isPending}
          >
            {isPending ? "Cancelling…" : "Cancel subscription"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
