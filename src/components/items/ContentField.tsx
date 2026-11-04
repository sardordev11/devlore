"use client";

import { CodeEditor } from "@/components/items/CodeEditor";
import { MarkdownEditor } from "@/components/items/MarkdownEditor";
import { Textarea } from "@/components/ui/textarea";
import type { ItemFieldProps } from "@/hooks/use-item-fields";
import { getFallbackLanguage } from "@/lib/code-language";
import {
  LANGUAGE_TYPE_SLUGS,
  MARKDOWN_TYPE_SLUGS,
} from "@/lib/validations/items";

interface ContentFieldProps {
  typeSlug: string;
  // From useItemFields' fieldProps("content").
  field: ItemFieldProps;
  onValueChange: (content: string) => void;
  language: string;
  invalid: boolean;
}

// Markdown for notes and prompts, Monaco for code types, plain text otherwise.
export function ContentField({
  typeSlug,
  field,
  onValueChange,
  language,
  invalid,
}: ContentFieldProps) {
  if (MARKDOWN_TYPE_SLUGS.has(typeSlug)) {
    return <MarkdownEditor {...field} onChange={onValueChange} />;
  }
  if (LANGUAGE_TYPE_SLUGS.has(typeSlug)) {
    return (
      <CodeEditor
        value={field.value}
        onChange={onValueChange}
        language={language}
        fallbackLanguage={getFallbackLanguage(typeSlug)}
        disabled={field.disabled}
        ariaLabel="Content"
        invalid={invalid}
      />
    );
  }
  return (
    <Textarea
      {...field}
      rows={10}
      className="max-h-96 font-mono text-xs leading-relaxed md:text-xs"
    />
  );
}
