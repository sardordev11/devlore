"use client";

import { Plus } from "lucide-react";

import { TYPE_OPTIONS } from "@/components/items/TypeSelector";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { CreatableTypeSlug } from "@/lib/validations/items";

interface CreateItemTriggerProps {
  // Labels the trigger "New <Type>", e.g. on /items/snippets.
  defaultType?: CreatableTypeSlug;
}

function getTriggerLabel(defaultType: CreatableTypeSlug | undefined) {
  return defaultType
    ? `New ${TYPE_OPTIONS.find((option) => option.slug === defaultType)?.label}`
    : "New Item";
}

function TriggerContent({ defaultType }: CreateItemTriggerProps) {
  return (
    <>
      <Plus data-icon="inline-start" />
      {/* The top bar is tight on mobile, so only the type pages always show the label. */}
      <span className={cn(!defaultType && "hidden sm:inline")}>
        {getTriggerLabel(defaultType)}
      </span>
    </>
  );
}

// Opens the New Item dialog; must be rendered inside its <Dialog>.
export function CreateItemTrigger({ defaultType }: CreateItemTriggerProps) {
  const label = getTriggerLabel(defaultType);

  return (
    <DialogTrigger
      render={<Button aria-label={label} title={label} className="pointer-coarse:h-10" />}
    >
      <TriggerContent defaultType={defaultType} />
    </DialogTrigger>
  );
}

// Shown while the plan streams in after the shell.
export function CreateItemTriggerFallback({ defaultType }: CreateItemTriggerProps) {
  return (
    <Button aria-label={getTriggerLabel(defaultType)} disabled>
      <TriggerContent defaultType={defaultType} />
    </Button>
  );
}
