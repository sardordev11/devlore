"use client";

import { useCallback, useState } from "react";

import type { FileTypeSlug } from "@/lib/file-constraints";
import type { UploadResponse } from "@/types/uploads";

// Posts a file to /api/upload, tracking progress (0-100) while it uploads.
// fetch() can't report upload progress, hence XMLHttpRequest.
export function useFileUpload() {
  const [progress, setProgress] = useState<number | null>(null);

  const upload = useCallback(
    (file: File, type: FileTypeSlug) =>
      new Promise<UploadResponse>((resolve) => {
        const body = new FormData();
        body.append("type", type);
        body.append("file", file);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload");
        xhr.responseType = "json";
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
        xhr.onload = () => {
          setProgress(null);
          const response = xhr.response as UploadResponse | null;
          resolve(
            response ?? { success: false, error: "Upload failed. Please try again." },
          );
        };
        xhr.onerror = () => {
          setProgress(null);
          resolve({ success: false, error: "Upload failed. Check your connection." });
        };

        setProgress(0);
        xhr.send(body);
      }),
    [],
  );

  return { upload, progress };
}
