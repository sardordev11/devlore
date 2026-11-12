"use client";

import { CrownIcon, Loader2Icon, SparklesIcon } from "lucide-react";

import { usePlanAccess } from "@/components/billing/PlanAccessContext";
import { toastUpgradeError } from "@/components/billing/UpgradePrompt";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UPGRADE_MESSAGES } from "@/lib/usage-limits";

const PRO_TOOLTIP = "AI features require Pro subscription";
const BUTTON_CLASSES = "text-muted-foreground hover:text-foreground";

interface ExplainCodeButtonProps {
  onClick: () => void;
  isPending: boolean;
}

// Free users (when plan limits apply) see a Crown with a tooltip; clicking it
// shows the upgrade toast. The action checks the plan again either way.
export function ExplainCodeButton({ onClick, isPending }: ExplainCodeButtonProps) {
  const { proLocked } = usePlanAccess();

  if (proLocked) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="xs"
              aria-label={`Explain (${PRO_TOOLTIP})`}
              onClick={() => toastUpgradeError(UPGRADE_MESSAGES.ai)}
              className={BUTTON_CLASSES}
            />
          }
        >
          <CrownIcon className="text-amber-400" aria-hidden />
          Explain
        </TooltipTrigger>
        <TooltipContent>{PRO_TOOLTIP}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      onClick={onClick}
      disabled={isPending}
      aria-label={isPending ? "Explaining code…" : "Explain code"}
      className={BUTTON_CLASSES}
    >
      {isPending ? (
        <Loader2Icon className="animate-spin" aria-hidden />
      ) : (
        <SparklesIcon className="text-blue-400" aria-hidden />
      )}
      Explain
    </Button>
  );
}
