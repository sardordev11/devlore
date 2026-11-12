"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { generateAutoTags } from "@/actions/ai";
import { toastUpgradeError } from "@/components/billing/UpgradePrompt";
import { getNewTags } from "@/lib/item-form";

interface TagSuggestionSource {
  title: string;
  content: string;
  // Current comma-separated tags field
  tags: string;
}

// AI tag suggestions for an item form: fetch, then accept or reject each one.
export function useTagSuggestions({ title, content, tags }: TagSuggestionSource) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  function suggest() {
    if (isPending) return;
    startTransition(async () => {
      const result = await generateAutoTags({ title, content });
      if (!result.success) {
        if (result.upgrade) toastUpgradeError(result.error);
        else toast.error(result.error);
        return;
      }
      const newTags = getNewTags(tags, result.data.tags);
      if (newTags.length === 0) toast.info("No new tags to suggest");
      setSuggestions(newTags);
    });
  }

  function dismiss(tag: string) {
    setSuggestions((current) => current.filter((suggestion) => suggestion !== tag));
  }

  return { suggestions, isPending, suggest, dismiss };
}
