import { scrapeAllSellers } from "@/lib/scrapers";
import type { ScrapedPrice } from "@/lib/scrapers";

export type LiveResult = ScrapedPrice & { score: number };

// Short words (e.g. "se", "2") are substrings of all sorts of unrelated
// words ("se" is inside "messenger"), so containment only counts for words
// long enough that it's a meaningful signal; short words must match exactly.
function wordsMatch(qWord: string, nWord: string): boolean {
  if (qWord === nWord) return true;
  if (qWord.length >= 4 && nWord.includes(qWord)) return true;
  if (nWord.length >= 4 && qWord.includes(nWord)) return true;
  return false;
}

// Rough relevance score with no database behind it: a literal substring
// match is the strongest signal (mirrors the boost in
// supabase/migrations/0002_search_ranking_boost.sql), then how many of the
// query's words show up in the name. Returns null only when NONE of the
// query's words matched at all, so a listing sharing just one word with the
// query still shows up (ranked below stronger matches) instead of being
// hidden outright — useful when nothing matches the query closely (e.g. a
// discontinued phone model no tracked seller stocks anymore).
function scoreMatch(name: string, query: string): number | null {
  const n = name.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return null;

  if (n.includes(q)) return 2 + 1;

  const qWords = q.split(/\s+/).filter(Boolean);
  const nWords = n.split(/[^a-z0-9]+/).filter(Boolean);
  const matched = qWords.filter((w) => nWords.some((nw) => wordsMatch(w, nw)));

  if (matched.length === 0) return null;

  return matched.length / qWords.length;
}

// Live-browses seller sites for the query and returns every individual
// listing found, flattened into one sortable list — nothing is read from or
// written to a database, and nothing is grouped into per-product cards, so
// every price from every checked seller is visible in the same view.
export async function liveSearch(query: string): Promise<{
  results: LiveResult[];
  listingCount: number;
}> {
  const scraped = await scrapeAllSellers(query);

  const results = scraped
    .map((r) => {
      const score = scoreMatch(r.productName, query);
      return score === null ? null : { ...r, score };
    })
    .filter((r): r is LiveResult => r !== null)
    .sort((a, b) => b.score - a.score || a.price - b.price);

  return { results: results.slice(0, 60), listingCount: scraped.length };
}
