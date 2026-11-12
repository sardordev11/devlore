"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { generateDescription } from "@/actions/ai";
import { toastUpgradeError } from "@/components/billing/UpgradePrompt";

// Unsaved form values the description is written from. Only the title is required.
export interface DescriptionSource {
  title: string;
  type?: string;
  content?: string;
  language?: string;
  url?: string;
  fileName?: string;
  mimeType?: string;
  tags?: string;
}

// Generates a description with AI and hands it to onGenerated (the field setter).
export function useDescriptionGenerator(
  source: DescriptionSource,
  onGenerated: (description: string) => void,
) {
  const [isPending, startTransition] = useTransition();

  function generate() {
    if (isPending) return;
    startTransition(async () => {
      const result = await generateDescription(source);
      if (!result.success) {
        if (result.upgrade) toastUpgradeError(result.error);
        else toast.error(result.error);
        return;
      }
      onGenerated(result.data.description);
    });
  }

  return { isPending, generate };
}
