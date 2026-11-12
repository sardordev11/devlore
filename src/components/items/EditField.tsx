import { Label } from "@/components/ui/label";

interface EditFieldProps {
  id: string;
  label: string;
  error?: string;
  // Shown at the end of the label row, e.g. a small button for the field
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function EditField({ id, label, error, action, children }: EditFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      {action ? (
        <div className="flex min-h-7 items-center justify-between gap-2">
          <Label htmlFor={id}>{label}</Label>
          {action}
        </div>
      ) : (
        <Label htmlFor={id}>{label}</Label>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
