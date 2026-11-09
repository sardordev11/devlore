import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface ChecklistProps {
  items: string[];
  className?: string;
}

export function Checklist({ items, className }: ChecklistProps) {
  return (
    <ul className={cn("grid content-start gap-3.5", className)}>
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-zinc-400">
          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-500">
            <CheckIcon className="size-3" strokeWidth={3} aria-hidden />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}
