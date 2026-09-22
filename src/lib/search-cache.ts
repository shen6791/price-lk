import type { LiveResult } from "./live-search";

// Best-effort, single-instance cache — NOT a distributed cache. Vercel can
// route two requests to two different serverless instances with separate
// memory, so this reduces duplicate scraping under moderate traffic but
// does not guarantee a cache hit. A real implementation (spec section 34)
// needs a shared store (Redis/Upstash) keyed the same way.
const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry = { results: LiveResult[]; listingCount: number; cachedAt: number };

const cache = new Map<string, CacheEntry>();

export function getCached(query: string): (CacheEntry & { fromCache: true }) | null {
  const entry = cache.get(query.toLowerCase().trim());
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    cache.delete(query.toLowerCase().trim());
    return null;
  }
  return { ...entry, fromCache: true };
}

export function setCached(query: string, results: LiveResult[], listingCount: number) {
  cache.set(query.toLowerCase().trim(), { results, listingCount, cachedAt: Date.now() });
  // Cheap unbounded-growth guard for a long-lived serverless instance.
  if (cache.size > 500) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
}
