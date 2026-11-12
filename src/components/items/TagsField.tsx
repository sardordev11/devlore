"use client";

import { CheckIcon, SparklesIcon, XIcon } from "lucide-react";
import { Suspense } from "react";

import { usePlanAccess } from "@/components/billing/PlanAccessContext";
import { EditField } from "@/components/items/EditField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ItemFieldProps } from "@/hooks/use-item-fields";
import { useTagSuggestions } from "@/hooks/use-tag-suggestions";
import { appendTag } from "@/lib/item-form";
import { TOUCH_ICON_BUTTON } from "@/lib/touch-target";
import { cn } from "@/lib/utils";

interface TagsFieldProps {
  field: ItemFieldProps;
  error?: string;
  onValueChange: (tags: string) => void;
  // What the AI suggests tags from
  title: string;
  content: string;
}

interface SuggestTagsButtonProps {
  onClick: () => void;
  isPending: boolean;
  disabled: boolean;
}

// Hidden for free users when plan limits apply; the action checks again.
function SuggestTagsButton({ onClick, isPending, disabled }: SuggestTagsButtonProps) {
  const { proLocked } = usePlanAccess();
  if (proLocked) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled || isPending}
      title={disabled ? "Add a title first" : undefined}
    >
      <SparklesIcon
        data-icon="inline-start"
        className={cn("text-blue-400", isPending && "animate-pulse")}
        aria-hidden
      />
      {isPending ? "Suggesting…" : "Suggest Tags"}
    </Button>
  );
}

export function TagsField({ field, error, onValueChange, title, content }: TagsFieldProps) {
  const { suggestions, isPending, suggest, dismiss } = useTagSuggestions({
    title,
    content,
    tags: field.value,
  });

  function accept(tag: string) {
    onValueChange(appendTag(field.value, tag));
    dismiss(tag);
  }

  return (
    <EditField
      id={field.id}
      label="Tags"
      error={error}
      action={
        <Suspense fallback={null}>
          <SuggestTagsButton
            onClick={suggest}
            isPending={isPending}
            disabled={field.disabled || !title.trim()}
          />
        </Suspense>
      }
    >
      <Input {...field} placeholder="react, hooks, auth" />

      {suggestions.length > 0 && (
        <ul aria-label="Suggested tags" className="flex flex-wrap gap-1.5">
          {suggestions.map((tag) => (
            <li key={tag}>
              <Badge
                variant="outline"
                className="h-auto gap-0.5 border-dashed py-0.5 pr-0.5 pl-2"
              >
                <SparklesIcon className="size-3 text-blue-400" aria-hidden />
                <span className="ml-0.5">{tag}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => accept(tag)}
                  disabled={field.disabled}
                  aria-label={`Add tag ${tag}`}
                  title="Add tag"
                  className={cn("text-emerald-400", TOUCH_ICON_BUTTON)}
                >
                  <CheckIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => dismiss(tag)}
                  aria-label={`Dismiss tag ${tag}`}
                  title="Dismiss"
                  className={cn("text-muted-foreground", TOUCH_ICON_BUTTON)}
                >
                  <XIcon />
                </Button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </EditField>
  );
}
