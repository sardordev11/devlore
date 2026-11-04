import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getItemFile } from "@/lib/db/items";
import { getFileKey, getFileStream } from "@/lib/r2";

function errorResponse(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

// Both forms, so browsers without RFC 5987 support still get an ASCII name.
function contentDisposition(fileName: string): string {
  const ascii = fileName.replace(/[^\x20-\x7e]|["\\]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

// Streams the file from R2 through the app, so downloads don't depend on the bucket's CORS rules.
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/items/[id]/download">,
) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);

  const { id } = await params;
  try {
    const file = await getItemFile(session.user.id, id);
    const key = file && getFileKey(file.fileUrl);
    if (!file || !key) return errorResponse("File not found", 404);

    const stream = await getFileStream(key);
    if (!stream) return errorResponse("File not found", 404);

    return new Response(stream, {
      headers: {
        "Content-Type": file.mimeType ?? "application/octet-stream",
        "Content-Disposition": contentDisposition(file.fileName),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("File download failed:", error);
    return errorResponse("Couldn't download the file", 500);
  }
}
