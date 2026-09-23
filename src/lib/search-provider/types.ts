export type SearchHit = {
  title: string;
  url: string;
  snippet: string;
};

// Swappable web-search backend. Only one implementation exists today
// (bing.ts); a future Google CSE or SerpApi provider just needs to
// implement this same interface and be swapped in where getSearchProvider()
// is called — nothing downstream (web-search.ts, generic.ts) changes.
export interface SearchProvider {
  search(query: string, count?: number): Promise<SearchHit[]>;
}
