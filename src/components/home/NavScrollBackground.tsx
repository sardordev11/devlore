"use client";

import { useSyncExternalStore, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const SCROLL_THRESHOLD = 16;

function subscribe(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

const getSnapshot = () => window.scrollY > SCROLL_THRESHOLD;
const getServerSnapshot = () => false;

// Fixed header that turns opaque once the page has scrolled.
export function NavScrollBackground({ children }: { children: ReactNode }) {
  const scrolled = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b backdrop-blur-sm transition-colors duration-300",
        scrolled
          ? "border-white/8 bg-home-bg/92"
          : "border-transparent bg-home-bg/35",
      )}
    >
      {children}
    </header>
  );
}
