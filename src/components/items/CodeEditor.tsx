"use client";

import Editor, { type OnMount } from "@monaco-editor/react";
import { useState } from "react";

import { EditorFrame, EditorTabs } from "@/components/items/EditorFrame";
import { MarkdownPreview } from "@/components/items/MarkdownEditor";
import {
  defineMonacoThemes,
  getMonacoThemeName,
  THEME_FRAME_CLASSES,
} from "@/components/items/monaco-themes";
import { registerMonacoSnippets } from "@/components/items/monaco-snippets";
import { useEditorPreferences } from "@/components/settings/EditorPreferencesContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useOverflowWidgetsNode } from "@/hooks/use-overflow-widgets-node";
import { toMonacoLanguage } from "@/lib/code-language";
import {
  clampEditorHeight,
  estimateEditorHeight,
  getLineHeight,
} from "@/lib/editor-height";
import { cn } from "@/lib/utils";

export type CodeEditorView = "code" | "explain";
const VIEWS: readonly CodeEditorView[] = ["code", "explain"];

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
  // Extra header buttons, before the language label (e.g. Explain).
  headerActions?: React.ReactNode;
  // AI explanation; when set, Code/Explain tabs replace the window dots.
  explanation?: string | null;
  view?: CodeEditorView;
  onViewChange?: (view: CodeEditorView) => void;
}

function WindowDots() {
  return (
    <div className="flex gap-1.5 px-1" aria-hidden="true">
      <span className="size-2.5 rounded-full bg-[#ff5f57]" />
      <span className="size-2.5 rounded-full bg-[#febc2e]" />
      <span className="size-2.5 rounded-full bg-[#28c840]" />
    </div>
  );
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
  headerActions,
  explanation,
  view = "code",
  onViewChange,
}: CodeEditorProps) {
  const { preferences } = useEditorPreferences();
  const lineHeight = getLineHeight(preferences.fontSize);
  const [height, setHeight] = useState(() => estimateEditorHeight(value, lineHeight));
  const monacoLanguage = toMonacoLanguage(language, fallbackLanguage);
  const overflowWidgetsNode = useOverflowWidgetsNode();

  // Grow with the content up to the max height, then scroll inside the editor.
  const handleMount: OnMount = (editor) => {
    setHeight(clampEditorHeight(editor.getContentHeight()));
    editor.onDidContentSizeChange((event) => {
      if (event.contentHeightChanged) {
        setHeight(clampEditorHeight(event.contentHeight));
      }
    });
  };

  const activeView: CodeEditorView = explanation ? view : "code";

  const header = explanation ? (
    <EditorTabs
      tabs={VIEWS}
      active={activeView}
      onChange={(next) => onViewChange?.(next)}
      label="Code view"
    />
  ) : (
    <WindowDots />
  );

  const actions = (
    <>
      {headerActions}
      <span className="font-mono text-xs text-muted-foreground">
        {monacoLanguage}
      </span>
    </>
  );

  return (
    <EditorFrame
      header={header}
      headerActions={actions}
      copyValue={activeView === "explain" && explanation ? explanation : value}
      invalid={invalid}
      className={THEME_FRAME_CLASSES[preferences.theme]}
    >
      {activeView === "explain" && explanation && <MarkdownPreview value={explanation} />}
      {/* Kept mounted while the explanation shows, so switching back is instant. */}
      <div className={cn(activeView === "explain" && "hidden")}>
        <Editor
          height={height}
          theme={getMonacoThemeName(preferences.theme)}
          beforeMount={(monaco) => {
            defineMonacoThemes(monaco);
            registerMonacoSnippets(monaco);
          }}
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
            overflowWidgetsDomNode: overflowWidgetsNode ?? undefined,
            overviewRulerLanes: 0,
            scrollbar: {
              alwaysConsumeMouseWheel: false,
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
          }}
        />
      </div>
    </EditorFrame>
  );
}
