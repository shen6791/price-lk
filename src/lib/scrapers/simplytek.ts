import { fetchWithTimeout } from "./fetch";
import type { ScrapedPrice } from "./types";

type SuggestResponse = {
  resources?: {
    results?: {
      products?: {
        title: string;
        price: string;
        available: boolean;
        url: string;
      }[];
    };
  };
};

export async function scrapeSimplyTek(query: string): Promise<ScrapedPrice[]> {
  const params = new URLSearchParams({
    q: query,
    "resources[type]": "product",
    "resources[limit]": "8",
  });
  const url = `https://www.simplytek.lk/search/suggest.json?${params.toString()}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) return [];
  const data: SuggestResponse = await res.json();
  const products = data.resources?.results?.products ?? [];

  return products
    .map((p) => {
      const price = parseFloat(p.price);
      if (!price) return null;
      return {
        productName: p.title.trim(),
        price,
        inStock: p.available,
        productUrl: `https://www.simplytek.lk${p.url.split("?")[0]}`,
        sellerSlug: "simplytek",
      } satisfies ScrapedPrice;
    })
    .filter((x): x is ScrapedPrice => x !== null);
}
