import { useId } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AuthFieldProps {
  name: string;
  label: string;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  placeholder?: string;
  errors?: string[];
}

export function AuthField({
  name,
  label,
  type = "text",
  autoComplete,
  placeholder,
  errors,
}: AuthFieldProps) {
  // Unique ids: hidden routes kept by Cache Components share the same DOM
  const id = useId();
  const errorId = `${id}-error`;
  const error = errors?.[0];

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
