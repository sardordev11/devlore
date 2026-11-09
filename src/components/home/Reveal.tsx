"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface RevealProps {
  className?: string;
  children: ReactNode;
}

// Fades its children in the first time they scroll into view. Children can
// react to it with `group-data-visible/reveal:` variants.
export function Reveal({ className, children }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-visible={visible || undefined}
      className={cn(
        "group/reveal transition-[opacity,translate] duration-700 ease-out",
        !visible && "motion-safe:translate-y-6 motion-safe:opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
