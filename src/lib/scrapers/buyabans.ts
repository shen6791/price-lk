import { fetchWithTimeout } from "./fetch";
import type { ScrapedPrice } from "./types";

type SearchResponse = {
  results?: { product_name: string; product_url: string }[];
};

// Buyabans' search endpoint only returns names/slugs, not prices — each
// candidate's price lives in a JSON blob embedded in its own product page,
// so this makes one extra request per candidate (in parallel, capped) to
// fill it in.
export async function scrapeBuyabans(query: string): Promise<ScrapedPrice[]> {
  const searchUrl = `https://buyabans.com/search?query=${encodeURIComponent(query)}`;
  const searchRes = await fetchWithTimeout(searchUrl);
  if (!searchRes.ok) return [];
  const data: SearchResponse = await searchRes.json();
  const candidates = (data.results ?? []).slice(0, 6);

  const withPrices = await Promise.allSettled(
    candidates.map(async (c) => {
      const productUrl = `https://buyabans.com/${c.product_url}`;
      const res = await fetchWithTimeout(productUrl);
      if (!res.ok) return null;
      const html = await res.text();

      const priceMatch = html.match(/&quot;special_price&quot;:&quot;([\d.]+)&quot;/) ??
        html.match(/&quot;price&quot;:&quot;([\d.]+)&quot;/);
      const price = priceMatch ? parseFloat(priceMatch[1]) : null;
      if (!price) return null;

      const stockMatch = html.match(/&quot;inventory&quot;:&quot;(\d+)&quot;/);
      const inStock = stockMatch ? parseInt(stockMatch[1], 10) > 0 : true;

      return {
        productName: c.product_name.trim(),
        price,
        inStock,
        productUrl,
        sellerSlug: "buyabans",
      } satisfies ScrapedPrice;
    })
  );

  return withPrices
    .filter((r): r is PromiseFulfilledResult<ScrapedPrice | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((v): v is ScrapedPrice => v !== null);
}
