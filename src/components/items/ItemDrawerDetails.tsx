"use client";

import { CalendarIcon, FileIcon, FolderIcon, TagIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Suspense } from "react";

import { CodeEditor } from "@/components/items/CodeEditor";
import { ExplainCodeButton } from "@/components/items/ExplainCodeButton";
import { MarkdownEditor } from "@/components/items/MarkdownEditor";
import { Badge } from "@/components/ui/badge";
import { useCodeExplanation } from "@/hooks/use-code-explanation";
import { useDetectedLanguage } from "@/hooks/use-detected-language";
import { canExplainType } from "@/lib/ai/explain";
import {
  getFallbackLanguage,
  shouldDetectLanguage,
} from "@/lib/code-language";
import { formatFileSize, isImageMimeType } from "@/lib/file-constraints";
import { formatLocalDate } from "@/lib/format-date";
import {
  LANGUAGE_TYPE_SLUGS,
  MARKDOWN_TYPE_SLUGS,
} from "@/lib/validations/items";
import type { ItemDetailJson } from "@/types/items";

interface ItemDrawerDetailsProps {
  item: ItemDetailJson;
}

interface CodeViewProps {
  itemId: string;
  content: string;
  language: string | null;
  typeSlug: string;
}

// Read-only code, with the language guessed for snippets saved without one,
// and an AI explanation for snippets and commands.
function CodeView({ itemId, content, language, typeSlug }: CodeViewProps) {
  const detectedLanguage = useDetectedLanguage(
    content,
    shouldDetectLanguage(typeSlug, language),
  );
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
            <ExplainCodeButton onClick={explain} isPending={isPending} />
          </Suspense>
        )
      }
    />
  );
}

interface DetailSectionProps {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}

export function DetailSection({
  title,
  icon: Icon,
  children,
}: DetailSectionProps) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {Icon && <Icon className="size-3.5" />}
        {title}
      </h3>
      {children}
    </section>
  );
}

function FilePreview({ item }: ItemDrawerDetailsProps) {
  const details = [
    item.fileSize !== null && formatFileSize(item.fileSize),
    item.mimeType,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-3">
      {item.fileUrl && isImageMimeType(item.mimeType) && (
        // Served from the public R2 domain, which next/image isn't configured for.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.fileUrl}
          alt={item.title}
          className="max-h-96 w-full rounded-lg border bg-muted/40 object-contain"
        />
      )}
      <div className="flex items-center gap-3 rounded-lg border p-3">
        <FileIcon className="size-8 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="break-all font-medium">{item.fileName}</p>
          {details.length > 0 && (
            <p className="text-xs text-muted-foreground">{details.join(" · ")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ItemContent({ item }: ItemDrawerDetailsProps) {
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

export function ItemDrawerDetails({ item }: ItemDrawerDetailsProps) {
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
          <ItemContent item={item} />
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

interface ItemMetaSectionsProps extends ItemDrawerDetailsProps {
  // The edit form shows a collection picker instead.
  showCollections?: boolean;
}

// Collections and dates, shown read-only. Edit mode keeps only the dates.
export function ItemMetaSections({
  item,
  showCollections = true,
}: ItemMetaSectionsProps) {
  return (
    <>
      {showCollections && item.collections.length > 0 && (
        <DetailSection title="Collections" icon={FolderIcon}>
          <div className="flex flex-wrap gap-1.5">
            {item.collections.map((collection) => (
              <Badge key={collection.id} variant="outline">
                {collection.name}
              </Badge>
            ))}
          </div>
        </DetailSection>
      )}

      <DetailSection title="Details" icon={CalendarIcon}>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
          <dt className="text-muted-foreground">Created</dt>
          <dd className="text-right">
            {formatLocalDate(item.createdAt, "long")}
          </dd>
          <dt className="text-muted-foreground">Updated</dt>
          <dd className="text-right">
            {formatLocalDate(item.updatedAt, "long")}
          </dd>
        </dl>
      </DetailSection>
    </>
  );
}
