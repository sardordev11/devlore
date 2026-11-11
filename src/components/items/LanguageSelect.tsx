"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ItemFieldProps } from "@/hooks/use-item-fields";
import {
  getLanguageOptions,
  getLanguageSelectValue,
} from "@/lib/code-language";

interface LanguageSelectProps {
  // From useItemFields' fieldProps("language").
  field: ItemFieldProps;
  onValueChange: (language: string) => void;
  // Label for the empty option, e.g. "Auto (TypeScript)" while detecting.
  noneLabel?: string;
}

// Language for code types. The editor below highlights with it right away.
export function LanguageSelect({
  field,
  onValueChange,
  noneLabel,
}: LanguageSelectProps) {
  const options = getLanguageOptions(field.value, noneLabel);

  return (
    <Select
      items={options}
      value={getLanguageSelectValue(field.value)}
      onValueChange={(next) => onValueChange(next ?? "")}
      disabled={field.disabled}
    >
      <SelectTrigger
        id={field.id}
        aria-invalid={field["aria-invalid"]}
        aria-describedby={field["aria-describedby"]}
        className="w-full sm:w-56"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value ?? "none"} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
