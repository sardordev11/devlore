"use client";

import Editor, { type OnMount } from "@monaco-editor/react";
import { useState } from "react";

import { EditorFrame } from "@/components/items/EditorFrame";
import { Skeleton } from "@/components/ui/skeleton";
import { toMonacoLanguage } from "@/lib/code-language";

const MAX_HEIGHT = 400;
const MIN_HEIGHT = 80;
const LINE_HEIGHT = 19;
const VERTICAL_PADDING = 24;

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  // Item language as typed by the user, e.g. "ts" or "bash".
  language?: string | null;
  // Used when no language is set, e.g. "shell" for commands.
  fallbackLanguage?: string;
  readOnly?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  invalid?: boolean;
}

function clampHeight(height: number) {
  return Math.min(Math.max(height, MIN_HEIGHT), MAX_HEIGHT);
}

// Rough first-paint height until Monaco reports the real content height.
function estimateHeight(value: string) {
  return clampHeight(value.split("\n").length * LINE_HEIGHT + VERTICAL_PADDING);
}

export function CodeEditor({
  value,
  onChange,
  language,
  fallbackLanguage = "plaintext",
  readOnly = false,
  disabled = false,
  ariaLabel = "Code editor",
  invalid = false,
}: CodeEditorProps) {
  const [height, setHeight] = useState(() => estimateHeight(value));
  const monacoLanguage = toMonacoLanguage(language, fallbackLanguage);

  // Grow with the content up to MAX_HEIGHT, then scroll inside the editor.
  const handleMount: OnMount = (editor) => {
    setHeight(clampHeight(editor.getContentHeight()));
    editor.onDidContentSizeChange((event) => {
      if (event.contentHeightChanged) {
        setHeight(clampHeight(event.contentHeight));
      }
    });
  };

  const header = (
    <div className="flex items-center gap-3 px-1">
      <div className="flex gap-1.5" aria-hidden="true">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
      </div>
      <span className="font-mono text-xs text-muted-foreground">
        {monacoLanguage}
      </span>
    </div>
  );

  return (
    <EditorFrame header={header} copyValue={value} invalid={invalid}>
      <Editor
        height={height}
        theme="vs-dark"
        language={monacoLanguage}
        value={value}
        onChange={(next) => onChange?.(next ?? "")}
        onMount={handleMount}
        loading={<Skeleton className="h-full w-full rounded-none" />}
        options={{
          readOnly: readOnly || disabled,
          domReadOnly: readOnly || disabled,
          ariaLabel,
          fontSize: 13,
          lineHeight: LINE_HEIGHT,
          fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          tabSize: 2,
          padding: { top: 12, bottom: 12 },
          renderLineHighlight: readOnly ? "none" : "line",
          automaticLayout: true,
          fixedOverflowWidgets: true,
          overviewRulerLanes: 0,
          scrollbar: {
            alwaysConsumeMouseWheel: false,
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
        }}
      />
    </EditorFrame>
  );
}
