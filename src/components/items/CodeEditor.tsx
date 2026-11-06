"use client";

import Editor, { type OnMount } from "@monaco-editor/react";
import { useState } from "react";

import { EditorFrame } from "@/components/items/EditorFrame";
import {
  defineMonacoThemes,
  getMonacoThemeName,
  THEME_FRAME_CLASSES,
} from "@/components/items/monaco-themes";
import { useEditorPreferences } from "@/components/settings/EditorPreferencesContext";
import { Skeleton } from "@/components/ui/skeleton";
import { toMonacoLanguage } from "@/lib/code-language";

const MAX_HEIGHT = 400;
const MIN_HEIGHT = 80;
// Monaco line height relative to the font size (19px at the default 13px).
const LINE_HEIGHT_RATIO = 1.45;
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

function getLineHeight(fontSize: number) {
  return Math.round(fontSize * LINE_HEIGHT_RATIO);
}

function clampHeight(height: number) {
  return Math.min(Math.max(height, MIN_HEIGHT), MAX_HEIGHT);
}

// Rough first-paint height until Monaco reports the real content height.
function estimateHeight(value: string, lineHeight: number) {
  return clampHeight(value.split("\n").length * lineHeight + VERTICAL_PADDING);
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
  const { preferences } = useEditorPreferences();
  const lineHeight = getLineHeight(preferences.fontSize);
  const [height, setHeight] = useState(() => estimateHeight(value, lineHeight));
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
    <div className="flex gap-1.5 px-1" aria-hidden="true">
      <span className="size-2.5 rounded-full bg-[#ff5f57]" />
      <span className="size-2.5 rounded-full bg-[#febc2e]" />
      <span className="size-2.5 rounded-full bg-[#28c840]" />
    </div>
  );

  const languageLabel = (
    <span className="font-mono text-xs text-muted-foreground">
      {monacoLanguage}
    </span>
  );

  return (
    <EditorFrame
      header={header}
      headerActions={languageLabel}
      copyValue={value}
      invalid={invalid}
      className={THEME_FRAME_CLASSES[preferences.theme]}
    >
      <Editor
        height={height}
        theme={getMonacoThemeName(preferences.theme)}
        beforeMount={defineMonacoThemes}
        language={monacoLanguage}
        value={value}
        onChange={(next) => onChange?.(next ?? "")}
        onMount={handleMount}
        loading={<Skeleton className="h-full w-full rounded-none" />}
        options={{
          readOnly: readOnly || disabled,
          domReadOnly: readOnly || disabled,
          ariaLabel,
          fontSize: preferences.fontSize,
          lineHeight,
          fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
          minimap: { enabled: preferences.minimap },
          scrollBeyondLastLine: false,
          wordWrap: preferences.wordWrap ? "on" : "off",
          tabSize: preferences.tabSize,
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
