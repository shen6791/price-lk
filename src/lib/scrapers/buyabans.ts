import { fetchWithTimeout } from "./fetch";
import type { ScrapedPrice } from "./types";

type SearchResponse = {
  results?: { product_id: number; product_name: string; product_url: string }[];
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

      // The page embeds pricing for the main product AND for bundled
      // freebie/add-on items (e.g. a free backpack with a laptop), each in
      // their own JSON blob — grabbing the first price on the page can
      // silently pick up the freebie's price instead of the actual
      // product's (verified against a real listing: a laptop's page led
      // with a bundled bag's Rs. 3,530 price ahead of the laptop's real
      // Rs. 189,990). The main product's own blob starts at
      // `<product-component :product="{"id":<id>`, and its accurate price
      // lives in a doubly-escaped `web_price_params.deal_price` field
      // within that block — anchor there instead of scanning the page.
      const marker = `product-component :product="{&quot;id&quot;:${c.product_id},`;
      const anchorIdx = html.indexOf(marker);
      if (anchorIdx === -1) return null;
      const productBlock = html.slice(anchorIdx, anchorIdx + 3000);

      const priceMatch = productBlock.match(/deal_price\\&quot;:(\d+(?:\.\d+)?)/);
      const price = priceMatch ? parseFloat(priceMatch[1]) : null;
      if (!price) return null;

      // Stock status isn't reliably present in this block (see comment
      // above) — Buyabans listings default to in-stock rather than risk a
      // false "out of stock" from a field we can't consistently locate.
      return {
        productName: c.product_name.trim(),
        price,
        inStock: true as boolean,
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
