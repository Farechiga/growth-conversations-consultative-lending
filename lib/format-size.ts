/*
 * Recommendation size display — Sprint 4 §A.4 (Sprint 3 review §3a).
 *
 * Renders the structured size_low / size_high range as a single-value
 * label when low === high, a hyphen-separated range when low < high,
 * or empty when both are null. Falls back to the legacy `size_proposed`
 * field for back-compat with seed data that may not yet have the
 * structured fields populated.
 *
 * The dollars() formatter is the existing helper (dynamic K/M scale).
 */

function dollars(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  if (n >= 1_000_000)
    return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString("en-US")}`;
}

/**
 * Returns a display string for a Recommendation's size:
 *   - null/null/null            → null   (caller chooses how to render)
 *   - low===high (or one set)   → "$75K"
 *   - low<high                  → "$4M-$7M"
 *
 * `size_proposed` is the legacy single-value field; if size_low/size_high
 * are both null but size_proposed is set, returns the legacy value's
 * formatted string. Once the demo's seed populates the new fields for all
 * Recommendations, the legacy fallback no longer fires; it stays as a
 * back-compat path for any future Recommendation rows missing the new
 * fields.
 */
export function formatRecommendationSize(input: {
  size_low: number | null;
  size_high: number | null;
  size_proposed?: number | null;
}): string | null {
  const { size_low, size_high, size_proposed } = input;
  if (size_low !== null && size_high !== null) {
    if (size_low === size_high) return dollars(size_low);
    return `${dollars(size_low)}-${dollars(size_high)}`;
  }
  if (size_low !== null) return dollars(size_low);
  if (size_high !== null) return dollars(size_high);
  if (size_proposed !== null && size_proposed !== undefined) return dollars(size_proposed);
  return null;
}
