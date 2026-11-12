"use client";

import { useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { EditorFrame, EditorTabs } from "@/components/items/EditorFrame";

type Tab = "write" | "preview";

interface MarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

const REMARK_PLUGINS = [remarkGfm];

// Links open in a new tab so the drawer or dialog isn't navigated away from.
const MARKDOWN_COMPONENTS: Components = {
  a: ({ href, title, children }) => (
    <a href={href} title={title} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};

interface MarkdownPreviewProps {
  value: string;
}

// Rendered Markdown in the editor frame's body, also used for AI explanations.
export function MarkdownPreview({ value }: MarkdownPreviewProps) {
  return (
    <div className="max-h-[400px] min-h-16 overflow-auto p-4">
      {value.trim() ? (
        <div className="markdown-preview">
          <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={MARKDOWN_COMPONENTS}>
            {value}
          </ReactMarkdown>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Nothing to preview.</p>
      )}
    </div>
  );
}

export function MarkdownEditor({
  value,
  onChange,
  readOnly = false,
  id,
  disabled = false,
  placeholder = "Write some Markdown…",
  ...ariaProps
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<Tab>(readOnly ? "preview" : "write");
  const activeTab: Tab = readOnly ? "preview" : tab;
  const tabs: Tab[] = readOnly ? ["preview"] : ["write", "preview"];

  const header = (
    <EditorTabs tabs={tabs} active={activeTab} onChange={setTab} label="Markdown editor" />
  );

  return (
    <EditorFrame
      header={header}
      copyValue={value}
      invalid={ariaProps["aria-invalid"]}
    >
      {activeTab === "write" ? (
        <textarea
          id={id}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          {...ariaProps}
          className="block field-sizing-content max-h-[400px] min-h-40 w-full resize-none bg-transparent p-4 font-mono text-xs leading-relaxed outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        />
      ) : (
        <MarkdownPreview value={value} />
      )}
    </EditorFrame>
  );
}
