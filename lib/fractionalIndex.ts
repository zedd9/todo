import { generateKeyBetween } from "fractional-indexing";

/**
 * Generate an order key that sorts between `before` and `after`.
 * Pass `null`/`undefined` for `before` to generate a key at the start of the
 * list, and `null`/`undefined` for `after` to generate a key at the end.
 */
export function generateOrderKey(
  before?: string | null,
  after?: string | null
): string {
  return generateKeyBetween(before ?? null, after ?? null);
}

export default generateOrderKey;
