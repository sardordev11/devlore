import { NextResponse } from "next/server";
import { z } from "zod";

import { handleBillingDeleted } from "@/lib/db/billing";

const webhookSchema = z.object({
  eventType: z.string(),
  data: z
    .object({ billingKey: z.string().min(1) })
    .partial()
    .optional(),
});

// Toss retries anything but a 200 for days, so every event we don't handle
// (and every malformed body) gets a 200. Unsigned BILLING_DELETED is safe:
// it can only stop a renewal for a real stored key, never grant Pro.
export async function POST(request: Request) {
  const parsed = webhookSchema.safeParse(await request.json().catch(() => null));
  const billingKey = parsed.success ? parsed.data.data?.billingKey : undefined;
  if (!parsed.success || parsed.data.eventType !== "BILLING_DELETED" || !billingKey) {
    return NextResponse.json({ success: true });
  }

  try {
    await handleBillingDeleted(billingKey);
    return NextResponse.json({ success: true });
  } catch (error) {
    // A 500 makes Toss retry later
    console.error("Toss webhook failed:", error);
    return NextResponse.json(
      { success: false, error: "Webhook failed" },
      { status: 500 },
    );
  }
}
