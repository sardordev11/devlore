"use client";

import { UpgradePrompt } from "@/components/billing/UpgradePrompt";
import { getTypeIcon } from "@/lib/type-icons";
import { isProOnlyTypeSlug } from "@/lib/usage-limits";
import { cn } from "@/lib/utils";
import type { CreatableTypeSlug } from "@/lib/validations/items";

// Matches the seeded system types.
export const TYPE_OPTIONS: {
  slug: CreatableTypeSlug;
  label: string;
  icon: string;
  color: string;
}[] = [
  { slug: "snippets", label: "Snippet", icon: "Code", color: "#3b82f6" },
  { slug: "prompts", label: "Prompt", icon: "Sparkles", color: "#8b5cf6" },
  { slug: "commands", label: "Command", icon: "Terminal", color: "#f97316" },
  { slug: "notes", label: "Note", icon: "StickyNote", color: "#fde047" },
  { slug: "links", label: "Link", icon: "Link", color: "#10b981" },
  { slug: "files", label: "File", icon: "File", color: "#6b7280" },
  { slug: "images", label: "Image", icon: "Image", color: "#ec4899" },
];

interface TypeSelectorProps {
  value: CreatableTypeSlug;
  onChange: (slug: CreatableTypeSlug) => void;
  disabled: boolean;
  // File and Image need Pro: shown disabled with an upgrade hint
  proLocked?: boolean;
}

const PRO_HINT_ID = "type-selector-pro-hint";

export function TypeSelector({
  value,
  onChange,
  disabled,
  proLocked = false,
}: TypeSelectorProps) {
  return (
    <div className="grid gap-2">
      <div
        role="radiogroup"
        aria-label="Item type"
        className="grid grid-cols-4 gap-2 sm:grid-cols-7"
      >
        {TYPE_OPTIONS.map((option) => {
          const Icon = getTypeIcon(option.icon);
          const selected = option.slug === value;
          const locked = proLocked && isProOnlyTypeSlug(option.slug);
          return (
            <button
              key={option.slug}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-describedby={locked ? PRO_HINT_ID : undefined}
              disabled={disabled || locked}
              onClick={() => onChange(option.slug)}
              className={cn(
                "relative flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-xs font-medium transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 disabled:hover:bg-transparent",
                selected
                  ? "border-foreground/40 bg-muted"
                  : "border-border text-muted-foreground",
              )}
            >
              <Icon className="size-4" style={{ color: option.color }} />
              {option.label}
              {locked && (
                <span className="absolute top-1 right-1 rounded-sm border px-1 text-[9px] leading-tight font-semibold">
                  PRO
                </span>
              )}
            </button>
          );
        })}
      </div>
      {proLocked && (
        <p id={PRO_HINT_ID} className="text-xs text-muted-foreground">
          File and Image uploads are part of Pro.{" "}
          <UpgradePrompt className="text-xs" />
        </p>
      )}
    </div>
  );
}
