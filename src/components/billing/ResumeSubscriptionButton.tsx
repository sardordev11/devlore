"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { resumeSubscription } from "@/actions/billing";
import { Button } from "@/components/ui/button";

export function ResumeSubscriptionButton() {
  const [isPending, startTransition] = useTransition();

  function handleResume() {
    startTransition(async () => {
      const result = await resumeSubscription();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Subscription resumed");
    });
  }

  return (
    <Button onClick={handleResume} disabled={isPending}>
      {isPending ? "Resuming…" : "Resume subscription"}
    </Button>
  );
}
