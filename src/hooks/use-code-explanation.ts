"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { explainCode } from "@/actions/ai";
import { toastUpgradeError } from "@/components/billing/UpgradePrompt";
import type { CodeEditorView } from "@/components/items/CodeEditor";

// Explains a saved snippet or command and switches the editor to the
// explanation. Nothing is saved, so each call asks the AI again.
export function useCodeExplanation(itemId: string, language: string | null) {
  const [isPending, startTransition] = useTransition();
  const [explanation, setExplanation] = useState<string | null>(null);
  const [view, setView] = useState<CodeEditorView>("code");

  function explain() {
    if (isPending) return;
    startTransition(async () => {
      const result = await explainCode({ itemId, language });
      if (!result.success) {
        if (result.upgrade) toastUpgradeError(result.error);
        else toast.error(result.error);
        return;
      }
      setExplanation(result.data.explanation);
      setView("explain");
    });
  }

  return { isPending, explanation, view, setView, explain };
}
