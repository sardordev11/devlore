"use client";

import { CalendarIcon, FolderIcon, TagIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ItemDetailJson } from "@/types/items";

// Rendered only on the client, so the viewer's own time zone is fine.
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });

interface ItemDrawerDetailsProps {
  item: ItemDetailJson;
}

interface DetailSectionProps {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}

function DetailSection({ title, icon: Icon, children }: DetailSectionProps) {
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
    return <p className="break-all">{item.fileName}</p>;
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

      {item.collections.length > 0 && (
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
            {DATE_FORMAT.format(new Date(item.createdAt))}
          </dd>
          <dt className="text-muted-foreground">Updated</dt>
          <dd className="text-right">
            {DATE_FORMAT.format(new Date(item.updatedAt))}
          </dd>
        </dl>
      </DetailSection>
    </div>
  );
}
