import * as cheerio from "cheerio";
import { fetchWithTimeout } from "./fetch";
import { parsePrice } from "./parse-price";
import type { ScrapedPrice } from "./types";

export async function scrapeCelltronics(query: string): Promise<ScrapedPrice[]> {
  const url = `https://celltronics.lk/?s=${encodeURIComponent(query)}&post_type=product`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) return [];
  const html = await res.text();
  const $ = cheerio.load(html);
  const results: ScrapedPrice[] = [];

  $(".wd-product").each((_, el) => {
    const card = $(el);
    const titleLink = card.find(".wd-entities-title a").first();
    const productName = titleLink.text().replace(/\s+/g, " ").trim();
    const productUrl = titleLink.attr("href") ?? "";
    if (!productName || !productUrl) return;

    const priceAmount = card.find(".price ins .amount, .price .amount").last();
    const price = parsePrice(priceAmount.text());
    if (!price) return;

    const inStock = !(card.attr("class") ?? "").includes("outofstock");

    results.push({ productName, price, inStock, productUrl, sellerSlug: "celltronics" });
  });

  return results.slice(0, 8);
}
