"use client";

import { Suspense } from "react";

import { AiHeaderButton } from "@/components/items/AiHeaderButton";
import { CodeEditor } from "@/components/items/CodeEditor";
import { useCodeExplanation } from "@/hooks/use-code-explanation";
import { useAutoLanguage } from "@/hooks/use-detected-language";
import { canExplainType } from "@/lib/ai/explain";
import { getFallbackLanguage } from "@/lib/code-language";

interface CodeViewProps {
  itemId: string;
  content: string;
  language: string | null;
  typeSlug: string;
}

// Read-only code, with the language guessed for snippets saved without one,
// and an AI explanation for snippets and commands.
export function CodeView({ itemId, content, language, typeSlug }: CodeViewProps) {
  const { detectedLanguage } = useAutoLanguage(typeSlug, language, content);
  const { isPending, explanation, view, setView, explain } = useCodeExplanation(
    itemId,
    language || detectedLanguage,
  );

  return (
    <CodeEditor
      value={content}
      language={language}
      fallbackLanguage={detectedLanguage ?? getFallbackLanguage(typeSlug)}
      ariaLabel="Content"
      readOnly
      explanation={explanation}
      view={view}
      onViewChange={setView}
      headerActions={
        canExplainType(typeSlug) && (
          <Suspense fallback={null}>
            <AiHeaderButton
              label="Explain"
              actionLabel="Explain code"
              pendingLabel="Explaining code…"
              onClick={explain}
              isPending={isPending}
            />
          </Suspense>
        )
      }
    />
  );
}
