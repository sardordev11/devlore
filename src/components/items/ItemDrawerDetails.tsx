"use client";

import { TagIcon } from "lucide-react";

import { CodeView } from "@/components/items/CodeView";
import { DetailSection } from "@/components/items/DetailSection";
import { FilePreview } from "@/components/items/FilePreview";
import { ItemMetaSections } from "@/components/items/ItemMetaSections";
import { MarkdownEditor } from "@/components/items/MarkdownEditor";
import { PromptView } from "@/components/items/PromptView";
import { Badge } from "@/components/ui/badge";
import { canOptimizeType } from "@/lib/ai/optimize";
import {
  LANGUAGE_TYPE_SLUGS,
  MARKDOWN_TYPE_SLUGS,
} from "@/lib/validations/items";
import type { ItemDetailJson } from "@/types/items";

interface ItemDrawerDetailsProps {
  item: ItemDetailJson;
  // Opens edit mode with this content filled in (an accepted AI rewrite).
  onEditWithContent?: (content: string) => void;
}

function ItemContent({ item, onEditWithContent }: ItemDrawerDetailsProps) {
  if (item.contentType === "URL" && item.url) {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all underline decoration-muted-foreground underline-offset-4 transition-colors hover:decoration-foreground"
      >
        {item.url}
      </a>
    );
  }
  if (item.contentType === "FILE" && item.fileName) {
    return <FilePreview item={item} />;
  }
  if (item.content && canOptimizeType(item.type.slug) && onEditWithContent) {
    return (
      <PromptView
        // A new item or saved edit starts without a stale suggestion
        key={`${item.id}:${item.updatedAt}`}
        itemId={item.id}
        content={item.content}
        onUseOptimized={onEditWithContent}
      />
    );
  }
  if (item.content && MARKDOWN_TYPE_SLUGS.has(item.type.slug)) {
    return <MarkdownEditor value={item.content} readOnly />;
  }
  if (item.content && LANGUAGE_TYPE_SLUGS.has(item.type.slug)) {
    return (
      <CodeView
        // A new item or saved edit starts without a stale explanation
        key={`${item.id}:${item.updatedAt}`}
        itemId={item.id}
        content={item.content}
        language={item.language}
        typeSlug={item.type.slug}
      />
    );
  }
  if (item.content) {
    return (
      <pre className="max-h-96 overflow-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs leading-relaxed">
        <code>{item.content}</code>
      </pre>
    );
  }
  return null;
}

export function ItemDrawerDetails({ item, onEditWithContent }: ItemDrawerDetailsProps) {
  const hasContent = Boolean(item.content || item.url || item.fileName);

  return (
    <div className="flex flex-col gap-6 p-6">
      {item.description && (
        <DetailSection title="Description">
          <p>{item.description}</p>
        </DetailSection>
      )}

      {hasContent && (
        <DetailSection title="Content">
          <ItemContent item={item} onEditWithContent={onEditWithContent} />
        </DetailSection>
      )}

      {item.tags.length > 0 && (
        <DetailSection title="Tags" icon={TagIcon}>
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </DetailSection>
      )}

      <ItemMetaSections item={item} />
    </div>
  );
}
