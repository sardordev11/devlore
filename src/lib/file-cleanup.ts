import "server-only";

import { deleteFile, getFileKey } from "@/lib/r2";

// Best effort: a failed delete only leaves an orphaned object behind, so it's
// logged and never thrown.
export async function deleteFilesQuietly(keys: string[]): Promise<void> {
  const results = await Promise.allSettled(keys.map((key) => deleteFile(key)));
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("R2 delete failed:", result.reason);
    }
  }
}

// Like deleteFilesQuietly, from stored Item.fileUrl values. Empty URLs and
// URLs outside the bucket are skipped.
export async function deleteFilesByUrl(
  fileUrls: (string | null | undefined)[],
): Promise<void> {
  const keys = fileUrls.flatMap((url) => {
    const key = url ? getFileKey(url) : null;
    return key ? [key] : [];
  });
  await deleteFilesQuietly(keys);
}
