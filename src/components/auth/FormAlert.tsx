import { cn } from "@/lib/utils";

interface FormAlertProps {
  variant: "error" | "success";
  children: React.ReactNode;
}

const VARIANT_CLASSES = {
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  success:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

// Message above a form: an error ("alert") or a confirmation ("status").
export function FormAlert({ variant, children }: FormAlertProps) {
  return (
    <p
      role={variant === "error" ? "alert" : "status"}
      className={cn("rounded-md border px-3 py-2 text-sm", VARIANT_CLASSES[variant])}
    >
      {children}
    </p>
  );
}
