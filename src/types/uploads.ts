// A file stored in R2 by POST /api/upload, not yet attached to an item.
export interface UploadedFile {
  key: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export type UploadResponse =
  | { success: true; data: UploadedFile }
  // upgrade: uploads are Pro only, so the client offers the upgrade link
  | { success: false; error: string; upgrade?: boolean };
