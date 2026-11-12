"use client";

import { CheckIcon, XIcon } from "lucide-react";
import { Suspense } from "react";

import { AiHeaderButton } from "@/components/items/AiHeaderButton";
import { EditorFrame, EditorTabs } from "@/components/items/EditorFrame";
import { MarkdownPreview } from "@/components/items/MarkdownEditor";
import { Button } from "@/components/ui/button";
import {
  type PromptSuggestion,
  type PromptView as View,
  usePromptOptimizer,
} from "@/hooks/use-prompt-optimizer";

const VIEWS: readonly View[] = ["original", "optimized"];

interface PromptViewProps {
  itemId: string;
  content: string;
  // Called with the optimized prompt when the user chooses to use it.
  onUseOptimized: (content: string) => void;
}

// Read-only prompt in the drawer with an AI "Optimize" button. A suggestion
// shows as Original / Optimized tabs and asks whether to use it.
export function PromptView({ itemId, content, onUseOptimized }: PromptViewProps) {
  const { isPending, suggestion, view, setView, optimize, discard } =
    usePromptOptimizer(itemId);
  const activeView: View = suggestion ? view : "original";

  const header = suggestion ? (
    <EditorTabs tabs={VIEWS} active={activeView} onChange={setView} label="Prompt view" />
  ) : (
    <EditorTabs tabs={["preview"]} active="preview" onChange={() => {}} label="Markdown editor" />
  );

  return (
    <EditorFrame
      header={header}
      copyValue={activeView === "optimized" && suggestion ? suggestion.optimized : content}
      headerActions={
        <Suspense fallback={null}>
          <AiHeaderButton
            label="Optimize"
            actionLabel="Optimize prompt"
            pendingLabel="Optimizing prompt…"
            onClick={optimize}
            isPending={isPending}
          />
        </Suspense>
      }
    >
      {activeView === "optimized" && suggestion ? (
        <OptimizedPrompt
          suggestion={suggestion}
          onUse={() => onUseOptimized(suggestion.optimized)}
          onKeepOriginal={discard}
        />
      ) : (
        <MarkdownPreview value={content} />
      )}
    </EditorFrame>
  );
}

interface OptimizedPromptProps {
  suggestion: PromptSuggestion;
  onUse: () => void;
  onKeepOriginal: () => void;
}

function OptimizedPrompt({ suggestion, onUse, onKeepOriginal }: OptimizedPromptProps) {
  return (
    <>
      <MarkdownPreview value={suggestion.optimized} />
      {suggestion.changes.length > 0 && (
        <div className="border-t px-4 py-3">
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">What changed</p>
          <ul className="list-disc space-y-1 pl-4 text-xs">
            {suggestion.changes.map((change) => (
              <li key={change}>{change}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-end gap-2 border-t bg-[#252525] px-4 py-2">
        <p className="mr-auto text-xs text-muted-foreground">Use this prompt instead?</p>
        <Button type="button" variant="ghost" size="sm" onClick={onKeepOriginal}>
          <XIcon />
          Keep original
        </Button>
        <Button type="button" size="sm" onClick={onUse}>
          <CheckIcon />
          Use this prompt
        </Button>
      </div>
    </>
  );
}
