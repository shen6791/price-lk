import { scrapeAllSellers } from "@/lib/scrapers";
import type { ScrapedPrice } from "@/lib/scrapers";

export type LiveResultGroup = {
  key: string;
  name: string;
  listings: ScrapedPrice[];
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

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
// query's words show up in the name. Returns null when fewer than half the
// query's words matched, so a listing that only shares one incidental word
// with a multi-word query gets dropped instead of ranked last.
function scoreMatch(name: string, query: string): number | null {
  const n = name.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return null;

  if (n.includes(q)) return 2 + 1;

  const qWords = q.split(/\s+/).filter(Boolean);
  const nWords = n.split(/[^a-z0-9]+/).filter(Boolean);
  const matched = qWords.filter((w) => nWords.some((nw) => wordsMatch(w, nw)));

  if (matched.length < Math.ceil(qWords.length / 2)) return null;

  return matched.length / qWords.length;
}

// Live-browses seller sites for the query and returns grouped results —
// nothing is read from or written to a database. Listings that look like
// the same product (same normalized title) are grouped into one card so
// the price comparison shows up directly, without a separate product page.
export async function liveSearch(query: string): Promise<{
  groups: LiveResultGroup[];
  listingCount: number;
}> {
  const results = await scrapeAllSellers(query);

  const groups = new Map<string, LiveResultGroup & { score: number }>();
  for (const r of results) {
    const key = slugify(r.productName);
    if (!key) continue;
    const existing = groups.get(key);
    if (existing) {
      existing.listings.push(r);
      continue;
    }
    // A seller's own search endpoint is often looser than ours (e.g.
    // matching on a single stray word), so anything scoreMatch rules
    // irrelevant is dropped rather than shown at the bottom of the list.
    const score = scoreMatch(r.productName, query);
    if (score === null) continue;
    groups.set(key, { key, name: r.productName, score, listings: [r] });
  }

  const sorted = [...groups.values()].sort(
    (a, b) => b.score - a.score || a.name.length - b.name.length
  );

  return { groups: sorted.slice(0, 25), listingCount: results.length };
}
