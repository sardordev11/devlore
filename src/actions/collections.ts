"use server";

import { z } from "zod";

import { auth } from "@/auth";
import {
  createCollection as createCollectionQuery,
  type CreatedCollection,
} from "@/lib/db/collections";
import { createCollectionSchema } from "@/lib/validations/collections";

type CreateCollectionResult =
  | { success: true; data: CreatedCollection }
  | {
      success: false;
      error: string;
      fieldErrors?: Partial<
        Record<keyof z.input<typeof createCollectionSchema>, string[]>
      >;
    };

export async function createCollection(
  data: unknown,
): Promise<CreateCollectionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in" };
  }

  const parsed = createCollectionSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid collection",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    const collection = await createCollectionQuery(session.user.id, parsed.data);
    return { success: true, data: collection };
  } catch (error) {
    console.error("Create collection failed:", error);
    return {
      success: false,
      error: "Couldn't create the collection. Please try again.",
    };
  }
}
