"use client";

import { SparklesIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { UPGRADE_PATH } from "@/lib/billing-display";
import { cn } from "@/lib/utils";

interface UpgradePromptProps {
  className?: string;
}

// Small "Upgrade to Pro" link for limit errors and Pro-only hints
export function UpgradePrompt({ className }: UpgradePromptProps) {
  return (
    <Link
      href={UPGRADE_PATH}
      className={cn(
        "inline-flex items-center gap-1 text-sm font-medium text-blue-400 underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none",
        className,
      )}
    >
      <SparklesIcon className="size-3.5" aria-hidden />
      Upgrade to Pro
    </Link>
  );
}

// Error toast for a plan limit, with the upgrade link under the message
export function toastUpgradeError(message: string) {
  toast.error(message, { description: <UpgradePrompt /> });
}
