"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EditorFrameProps {
  // Left side of the header (tabs, language label).
  header: React.ReactNode;
  // Right side of the header, just before the copy button.
  headerActions?: React.ReactNode;
  copyValue: string;
  invalid?: boolean;
  // Extra classes for the outer frame, e.g. a theme background.
  className?: string;
  children: React.ReactNode;
}

// Dark VS Code-style frame shared by MarkdownEditor and CodeEditor.
export function EditorFrame({
  header,
  headerActions,
  copyValue,
  invalid = false,
  className,
  children,
}: EditorFrameProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-[#1e1e1e] transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        invalid && "border-destructive/50 ring-3 ring-destructive/40",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b bg-[#2d2d2d] px-2 py-1">
        {header}
        <div className="flex items-center gap-2">
          {headerActions}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={handleCopy}
            disabled={!copyValue}
            aria-label="Copy content"
            className="text-muted-foreground hover:text-foreground"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}
