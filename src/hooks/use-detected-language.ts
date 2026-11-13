"use client";

import { useEffect, useState } from "react";

import { shouldDetectLanguage } from "@/lib/code-language";

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

// Detects the language only for types that guess it (snippets) and only
// while no language is set. autoDetect tells the Language select to show "Auto".
export function useAutoLanguage(
  typeSlug: string,
  language: string | null | undefined,
  code: string,
) {
  const autoDetect = shouldDetectLanguage(typeSlug, language);
  const detectedLanguage = useDetectedLanguage(code, autoDetect);
  return { autoDetect, detectedLanguage };
}
