import type { LucideIcon } from "lucide-react";

interface DetailSectionProps {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}

// Labelled section in the item drawer, e.g. Description, Tags or Details.
export function DetailSection({
  title,
  icon: Icon,
  children,
}: DetailSectionProps) {
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
