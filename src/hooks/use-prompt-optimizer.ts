"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { optimizePrompt } from "@/actions/ai";
import { toastUpgradeError } from "@/components/billing/UpgradePrompt";

export type PromptView = "original" | "optimized";

export interface PromptSuggestion {
  optimized: string;
  changes: string[];
}

// Asks the AI to refine a saved prompt and switches to the suggestion. Nothing
// is saved; the caller decides whether to use it.
export function usePromptOptimizer(itemId: string) {
  const [isPending, startTransition] = useTransition();
  const [suggestion, setSuggestion] = useState<PromptSuggestion | null>(null);
  const [view, setView] = useState<PromptView>("original");

  function optimize() {
    if (isPending) return;
    startTransition(async () => {
      const result = await optimizePrompt({ itemId });
      if (!result.success) {
        if (result.upgrade) toastUpgradeError(result.error);
        else toast.error(result.error);
        return;
      }
      const { optimized, changes } = result.data;
      if (!optimized) {
        toast.success("This prompt already looks good. No changes suggested.");
        return;
      }
      setSuggestion({ optimized, changes });
      setView("optimized");
    });
  }

  function discard() {
    setSuggestion(null);
    setView("original");
  }

  return { isPending, suggestion, view, setView, optimize, discard };
}
