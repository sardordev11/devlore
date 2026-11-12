"use client";

import { CrownIcon, Loader2Icon, SparklesIcon } from "lucide-react";

import { usePlanAccess } from "@/components/billing/PlanAccessContext";
import { toastUpgradeError } from "@/components/billing/UpgradePrompt";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UPGRADE_MESSAGES } from "@/lib/usage-limits";

const PRO_TOOLTIP = "AI features require Pro subscription";
const BUTTON_CLASSES = "text-muted-foreground hover:text-foreground";

interface AiHeaderButtonProps {
  // Visible text, e.g. "Explain" or "Optimize".
  label: string;
  // Screen reader labels, e.g. "Explain code" / "Explaining code…".
  actionLabel: string;
  pendingLabel: string;
  onClick: () => void;
  isPending: boolean;
}

// AI action in an editor header ("Explain", "Optimize"). Free users (when plan
// limits apply) see a Crown with a tooltip; clicking it shows the upgrade toast.
// The action checks the plan again either way.
export function AiHeaderButton({
  label,
  actionLabel,
  pendingLabel,
  onClick,
  isPending,
}: AiHeaderButtonProps) {
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
              aria-label={`${label} (${PRO_TOOLTIP})`}
              onClick={() => toastUpgradeError(UPGRADE_MESSAGES.ai)}
              className={BUTTON_CLASSES}
            />
          }
        >
          <CrownIcon className="text-amber-400" aria-hidden />
          {label}
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
      aria-label={isPending ? pendingLabel : actionLabel}
      className={BUTTON_CLASSES}
    >
      {isPending ? (
        <Loader2Icon className="animate-spin" aria-hidden />
      ) : (
        <SparklesIcon className="text-blue-400" aria-hidden />
      )}
      {label}
    </Button>
  );
}
