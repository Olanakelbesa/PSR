// ============================================================================
// RPDMS — Zod Validation Safe-Parse Utility
// ============================================================================
// Guards every API response against shape mismatches.
// Throw early at the service layer rather than crashing silently in UI.

import { ZodSchema } from "zod";

/**
 * Validates `data` against `schema`.
 * Throws a descriptive Error when the shape does not match.
 * Use in service functions immediately after `res.data` is received.
 */
export const safeParse = <T>(schema: ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`API response validation failed — ${issues}`);
  }
  return result.data;
};

/**
 * Like safeParse, but returns null instead of throwing.
 * Use when validation failure is recoverable (e.g., partial data display).
 */
export const safeParseOrNull = <T>(
  schema: ZodSchema<T>,
  data: unknown,
): T | null => {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
};
