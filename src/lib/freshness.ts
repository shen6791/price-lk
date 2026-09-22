export type Freshness = "FRESH" | "RECENT" | "STALE" | "VERY_STALE";

// Thresholds are deliberately centralized here so they're easy to tune —
// see SmartTech Finder spec section 16.
const HOUR = 60 * 60 * 1000;
const THRESHOLDS: Record<Exclude<Freshness, "VERY_STALE">, number> = {
  FRESH: 6 * HOUR,
  RECENT: 24 * HOUR,
  STALE: 3 * 24 * HOUR,
};

export function classifyFreshness(checkedAt: Date | string): Freshness {
  const ageMs = Date.now() - new Date(checkedAt).getTime();
  if (ageMs < THRESHOLDS.FRESH) return "FRESH";
  if (ageMs < THRESHOLDS.RECENT) return "RECENT";
  if (ageMs < THRESHOLDS.STALE) return "STALE";
  return "VERY_STALE";
}

export function freshnessLabel(checkedAt: Date | string): string {
  const ageMs = Date.now() - new Date(checkedAt).getTime();
  const minutes = Math.round(ageMs / 60000);
  if (minutes < 1) return "Checked just now";
  if (minutes < 60) return `Checked ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Checked ${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Checked yesterday";
  return `Checked ${days} days ago`;
}
