import { Label } from "@/components/ui/label";

interface EditFieldProps {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}

export function EditField({ id, label, error, children }: EditFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
