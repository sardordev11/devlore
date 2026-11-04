"use client";

import { useEffect, useState } from "react";

// A data URL for previewing a local image; null until it's read.
export function useDataUrl(file: File | null): string | null {
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(
    null,
  );
  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPreview({ file, url: reader.result });
      }
    };
    reader.readAsDataURL(file);
    return () => reader.abort();
  }, [file]);
  // Ignores a preview left over from a previous file.
  return preview && preview.file === file ? preview.url : null;
}
