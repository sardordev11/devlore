import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  align?: "center" | "left";
  as?: "h1" | "h2";
  className?: string;
  children?: ReactNode;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="mb-4 inline-block font-mono text-xs tracking-[0.12em] text-zinc-500 uppercase">
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  as: Heading = "h2",
  className,
  children,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        align === "center" && "mx-auto max-w-160 text-center",
        className,
      )}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Heading
        className={cn(
          "font-bold tracking-tight text-balance",
          Heading === "h1"
            ? "text-[clamp(38px,6.5vw,68px)] leading-[1.05] font-extrabold tracking-[-0.035em]"
            : "text-[clamp(28px,4vw,40px)] leading-[1.15]",
        )}
      >
        {title}
      </Heading>
      {subtitle && (
        <p
          className={cn(
            "mt-4 text-[17px] leading-relaxed text-zinc-400",
            Heading === "h1" && "mx-auto mt-6 max-w-150 text-lg",
          )}
        >
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}
