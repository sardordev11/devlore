import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { ITEM_NOT_FOUND } from "@/lib/action-helpers";
import { apiError } from "@/lib/api-response";
import { getItemDetail } from "@/lib/db/items";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/items/[id]">,
) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const { id } = await params;
  try {
    const item = await getItemDetail(session.user.id, id);
    if (!item) return apiError(ITEM_NOT_FOUND, 404);

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("Failed to load item", error);
    return apiError("Failed to load item", 500);
  }
}
