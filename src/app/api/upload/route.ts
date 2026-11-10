import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  checkFile,
  FILE_CONSTRAINTS,
  isFileTypeSlug,
} from "@/lib/file-constraints";
import { checkUploadAccess } from "@/lib/plan-gate";
import { createFileKey, uploadFile } from "@/lib/r2";
import {
  checkRateLimit,
  rateLimitMessage,
  retryAfterSeconds,
} from "@/lib/rate-limit";

// Room for the multipart boundaries and the other form fields.
const FORM_OVERHEAD = 64 * 1024;

function errorResponse(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

// Stores one file in R2 under the user's prefix. The item itself is created
// afterwards by the createItem server action, using the returned key.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);

  const limit = await checkRateLimit("upload", session.user.id);
  if (!limit.success) {
    return NextResponse.json(
      { success: false, error: rateLimitMessage(limit.reset) },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds(limit.reset)) } },
    );
  }

  // Uploads are Pro only when limits are enforced; checked before buffering
  const upgradeMessage = await checkUploadAccess(session.user.id);
  if (upgradeMessage) {
    return NextResponse.json(
      { success: false, error: upgradeMessage, upgrade: true },
      { status: 403 },
    );
  }

  // Reject oversized bodies before buffering them.
  const maxSize = Math.max(
    ...Object.values(FILE_CONSTRAINTS).map((rule) => rule.maxSize),
  );
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maxSize + FORM_OVERHEAD) {
    return errorResponse("File is too large", 413);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Invalid upload", 400);
  }

  const type = formData.get("type");
  const file = formData.get("file");
  if (typeof type !== "string" || !isFileTypeSlug(type)) {
    return errorResponse("Choose a file or image type", 400);
  }
  if (!(file instanceof File)) return errorResponse("No file uploaded", 400);

  const check = checkFile(file, type);
  if (!check.ok) return errorResponse(check.error, 400);

  const key = createFileKey(session.user.id, check.extension);
  try {
    await uploadFile(key, new Uint8Array(await file.arrayBuffer()), check.mimeType);
  } catch (error) {
    console.error("R2 upload failed:", error);
    return errorResponse("Couldn't upload the file. Please try again.", 502);
  }

  return NextResponse.json({
    success: true,
    data: {
      key,
      fileName: file.name,
      fileSize: file.size,
      mimeType: check.mimeType,
    },
  });
}
