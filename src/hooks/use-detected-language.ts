"use client";

import { useEffect, useState } from "react";

// Wait for a pause in typing before re-running detection.
const DETECT_DELAY_MS = 300;

// Monaco language guessed from the code, or null when disabled or unsure.
// The detector (highlight.js) is loaded only when first needed.
export function useDetectedLanguage(
  code: string,
  enabled: boolean,
): string | null {
  const [detected, setDetected] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const id = setTimeout(async () => {
      const { detectLanguage } = await import("@/lib/detect-language");
      if (!cancelled) setDetected(detectLanguage(code));
    }, DETECT_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [code, enabled]);

  return enabled ? detected : null;
}
