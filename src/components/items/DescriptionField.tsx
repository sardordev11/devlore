"use client";

import { SparklesIcon } from "lucide-react";
import { Suspense } from "react";

import { usePlanAccess } from "@/components/billing/PlanAccessContext";
import { EditField } from "@/components/items/EditField";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  useDescriptionGenerator,
  type DescriptionSource,
} from "@/hooks/use-description-generator";
import type { ItemFieldProps } from "@/hooks/use-item-fields";
import { TOUCH_ICON_BUTTON } from "@/lib/touch-target";
import { cn } from "@/lib/utils";

interface DescriptionFieldProps {
  field: ItemFieldProps;
  error?: string;
  onValueChange: (description: string) => void;
  // What the AI writes the description from
  source: DescriptionSource;
}

interface GenerateDescriptionButtonProps {
  onClick: () => void;
  isPending: boolean;
  disabled: boolean;
}

// Hidden for free users when plan limits apply; the action checks again.
function GenerateDescriptionButton({
  onClick,
  isPending,
  disabled,
}: GenerateDescriptionButtonProps) {
  const { proLocked } = usePlanAccess();
  if (proLocked) return null;

  const label = isPending ? "Generating description…" : "Generate description";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onClick}
      disabled={disabled || isPending}
      aria-label={label}
      title={disabled ? "Add a title first" : label}
      className={TOUCH_ICON_BUTTON}
    >
      <SparklesIcon
        className={cn("text-blue-400", isPending && "animate-pulse")}
        aria-hidden
      />
    </Button>
  );
}

export function DescriptionField({ field, error, onValueChange, source }: DescriptionFieldProps) {
  const { isPending, generate } = useDescriptionGenerator(source, onValueChange);

  return (
    <EditField
      id={field.id}
      label="Description"
      error={error}
      action={
        <Suspense fallback={null}>
          <GenerateDescriptionButton
            onClick={generate}
            isPending={isPending}
            disabled={field.disabled || !source.title.trim()}
          />
        </Suspense>
      }
    >
      <Textarea
        {...field}
        disabled={field.disabled || isPending}
        rows={2}
        placeholder={isPending ? "Writing a description…" : undefined}
      />
    </EditField>
  );
}
