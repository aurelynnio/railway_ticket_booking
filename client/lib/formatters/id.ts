/**
 * Compact an ID for display — show first 4 and last 4 chars with ellipsis.
 * e.g. "550e8400-e29b-41d4-a716-446655440000" → "550e…0000"
 */
export function compactId(id: string | null | undefined, head = 4, tail = 4): string {
  if (!id) return "";
  if (id.length <= head + tail + 1) return id;
  return `${id.slice(0, head)}…${id.slice(-tail)}`;
}
