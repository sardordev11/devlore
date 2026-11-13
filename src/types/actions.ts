import type { z } from "zod";

export type ActionFailure = { success: false; error: string };

// The { success, data, error } result returned by server actions.
export type ActionResult<T> = { success: true; data: T } | ActionFailure;

// Per-field Zod messages for a form schema, keyed by its input fields.
export type FieldErrors<S extends z.ZodType> = Partial<
  Record<keyof z.input<S>, string[]>
>;
