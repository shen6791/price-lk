import type { SearchProvider, SearchHit } from "./types";

type BingResponse = {
  webPages?: {
    value?: { name: string; url: string; snippet: string }[];
  };
};

export class BingSearchProvider implements SearchProvider {
  constructor(
    private apiKey: string,
    private endpoint = "https://api.bing.microsoft.com/v7.0/search"
  ) {}

  async search(query: string, count = 10): Promise<SearchHit[]> {
    const url = `${this.endpoint}?q=${encodeURIComponent(query)}&count=${count}&mkt=en-LK`;
    const res = await fetch(url, {
      headers: { "Ocp-Apim-Subscription-Key": this.apiKey },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      throw new Error(`Bing Search API returned ${res.status}`);
    }
    const data: BingResponse = await res.json();
    return (data.webPages?.value ?? []).map((v) => ({
      title: v.name,
      url: v.url,
      snippet: v.snippet,
    }));
  }
}

let cached: BingSearchProvider | null = null;

// Returns null when BING_SEARCH_API_KEY isn't set, so the web-search layer
// can no-op gracefully instead of crashing every search when no key has
// been provided yet.
export function getBingProvider(): BingSearchProvider | null {
  const key = process.env.BING_SEARCH_API_KEY;
  if (!key) return null;
  if (!cached) {
    cached = new BingSearchProvider(key, process.env.BING_SEARCH_ENDPOINT);
  }
  return cached;
}
