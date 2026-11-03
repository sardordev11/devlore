"use client";

import { useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { EditorFrame } from "@/components/items/EditorFrame";
import { cn } from "@/lib/utils";

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
    <div role="tablist" aria-label="Markdown editor" className="flex gap-1">
      {tabs.map((name) => (
        <button
          key={name}
          type="button"
          role="tab"
          aria-selected={activeTab === name}
          onClick={() => setTab(name)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            activeTab === name
              ? "bg-white/10 text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {name}
        </button>
      ))}
    </div>
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
        <div className="max-h-[400px] min-h-16 overflow-auto p-4">
          {value.trim() ? (
            <div className="markdown-preview">
              <ReactMarkdown
                remarkPlugins={REMARK_PLUGINS}
                components={MARKDOWN_COMPONENTS}
              >
                {value}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Nothing to preview.</p>
          )}
        </div>
      )}
    </EditorFrame>
  );
}
