import { getBingProvider } from "@/lib/search-provider/bing";
import { extractFromPage } from "./generic";
import type { ScrapedPrice } from "./types";

// Domains already covered by a dedicated, precise scraper — skip these in
// web-search results so we don't run the less-reliable generic extractor
// against a site we already parse correctly, and don't show duplicate rows
// for the same listing under two different confidence levels.
const DEDICATED_DOMAINS = new Set([
  "celltronics.lk",
  "wasi.lk",
  "simplytek.lk",
  "buyabans.com",
]);

const MAX_PAGES_TO_FETCH = 8;

// Searches the open web (via whichever SearchProvider is configured) for
// Sri Lankan listings of the query, then runs the generic extractor
// (structured data first, best-effort text parsing as fallback — see
// generic.ts) against each result page. Returns [] with no error when no
// search provider is configured (BING_SEARCH_API_KEY unset), so the rest
// of the app works unchanged until a key is added.
export async function scrapeWebSearch(query: string): Promise<ScrapedPrice[]> {
  const provider = getBingProvider();
  if (!provider) return [];

  let hits;
  try {
    hits = await provider.search(`${query} price Sri Lanka buy`, MAX_PAGES_TO_FETCH * 2);
  } catch {
    return [];
  }

  const candidates = hits
    .filter((h) => {
      try {
        const domain = new URL(h.url).hostname.replace(/^www\./, "");
        return !DEDICATED_DOMAINS.has(domain);
      } catch {
        return false;
      }
    })
    .slice(0, MAX_PAGES_TO_FETCH);

  const results = await Promise.allSettled(candidates.map((h) => extractFromPage(h.url)));

  return results
    .filter((r): r is PromiseFulfilledResult<ScrapedPrice | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((v): v is ScrapedPrice => v !== null);
}
