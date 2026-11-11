import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const VARIANTS = {
  primary:
    "bg-home-accent text-white hover:-translate-y-px hover:bg-home-accent-hover hover:shadow-[0_8px_24px_rgb(59_130_246/0.35)]",
  outline:
    "border-white/14 bg-white/2 text-foreground hover:border-white/30 hover:bg-white/6",
  ghost: "text-muted-foreground hover:bg-transparent hover:text-foreground",
} as const;

const SIZES = {
  // 44px tap target on mobile, compact from md up.
  default: "h-11 px-4 text-sm md:h-9",
  lg: "h-12 px-6 text-[15px]",
} as const;

interface CtaStyleOptions {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  block?: boolean;
  className?: string;
}

// Homepage button look, shared with real buttons such as /upgrade's checkout
export function getCtaClassName({
  variant = "primary",
  size = "default",
  block = false,
  className,
}: CtaStyleOptions) {
  return cn(
    "rounded-[10px] font-semibold transition-[background-color,border-color,color,transform,box-shadow] duration-200 focus-visible:ring-home-accent/60",
    VARIANTS[variant],
    SIZES[size],
    block && "w-full",
    className,
  );
}

interface CtaLinkProps extends CtaStyleOptions {
  href: string;
  children: ReactNode;
}

// shadcn Button rendered as a next/link, styled for the homepage.
export function CtaLink({
  href,
  variant = "primary",
  size = "default",
  block = false,
  className,
  children,
}: CtaLinkProps) {
  return (
    <Button
      variant={variant === "primary" ? "default" : variant}
      nativeButton={false}
      render={<Link href={href} />}
      className={getCtaClassName({ variant, size, block, className })}
    >
      {children}
    </Button>
  );
}
