import * as cheerio from "cheerio";
import { fetchWithTimeout } from "./fetch";
import { parsePrice } from "./parse-price";
import type { ScrapedPrice } from "./types";

type JsonLdProduct = {
  "@type"?: string | string[];
  name?: string;
  offers?: JsonLdOffer | JsonLdOffer[];
};
type JsonLdOffer = {
  "@type"?: string;
  price?: string | number;
  priceCurrency?: string;
  availability?: string;
};

function isProductType(t: string | string[] | undefined): boolean {
  if (!t) return false;
  const types = Array.isArray(t) ? t : [t];
  return types.some((x) => x?.toLowerCase().includes("product"));
}

function offerToResult(
  offer: JsonLdOffer | undefined,
  name: string,
  url: string,
  domain: string
): ScrapedPrice | null {
  if (!offer?.price) return null;
  const price = typeof offer.price === "number" ? offer.price : parsePrice(String(offer.price));
  if (!price) return null;

  const availability = (offer.availability ?? "").toLowerCase();
  const inStock = availability
    ? availability.includes("instock") || availability.includes("in_stock")
    : true;

  return {
    productName: name,
    price,
    inStock,
    productUrl: url,
    sellerSlug: domain,
    confidence: "structured",
  };
}

// Looks for valid JSON-LD Product/Offer markup (schema.org) on the page —
// the one source of price data reliable enough to trust without a
// site-specific parser, since it's the same structured format most
// e-commerce platforms emit for their own SEO/rich-snippets.
function extractStructured(
  $: cheerio.CheerioAPI,
  url: string,
  domain: string
): ScrapedPrice | null {
  const scripts = $('script[type="application/ld+json"]');
  for (const el of scripts.toArray()) {
    let json: unknown;
    try {
      json = JSON.parse($(el).contents().text());
    } catch {
      continue;
    }
    const candidates = Array.isArray(json) ? json : [json];
    for (const candidate of candidates) {
      const node = candidate as JsonLdProduct & { "@graph"?: JsonLdProduct[] };
      const items = node["@graph"] ? node["@graph"] : [node];
      for (const item of items) {
        if (!isProductType(item["@type"])) continue;
        const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
        const result = offerToResult(offer, item.name ?? $("title").text(), url, domain);
        if (result) return result;
      }
    }
  }
  return null;
}

const IN_STOCK_PATTERNS = /\b(in stock|add to cart|add to bag|buy now)\b/i;
const OUT_OF_STOCK_PATTERNS = /\b(out of stock|sold out|unavailable|notify me)\b/i;
const CURRENCY_NEAR_PRICE = /(?:rs\.?|lkr|රු)\s?[\d,]{3,}(?:\.\d+)?/i;

// No structured data found — fall back to guessing from visible page text.
// This is inherently less reliable (confirmed by the earlier Buyabans bug,
// which happened even WITH a known page structure) — every result from
// this path is tagged "best-effort" so the UI can warn the user instead of
// presenting it with the same confidence as a verified scraper.
function extractBestEffort(
  $: cheerio.CheerioAPI,
  url: string,
  domain: string
): ScrapedPrice | null {
  const bodyText = $("body").text();
  const priceMatch = bodyText.match(CURRENCY_NEAR_PRICE);
  if (!priceMatch) return null;
  const price = parsePrice(priceMatch[0]);
  if (!price) return null;

  const name =
    $('meta[property="og:title"]').attr("content")?.trim() || $("title").text().trim();
  if (!name) return null;

  let inStock = true;
  if (OUT_OF_STOCK_PATTERNS.test(bodyText) && !IN_STOCK_PATTERNS.test(bodyText)) {
    inStock = false;
  }

  return {
    productName: name,
    price,
    inStock,
    productUrl: url,
    sellerSlug: domain,
    confidence: "best-effort",
  };
}

export async function extractFromPage(url: string): Promise<ScrapedPrice | null> {
  let domain: string;
  try {
    domain = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }

  const res = await fetchWithTimeout(url, 6000);
  if (!res.ok) return null;
  const html = await res.text();
  const $ = cheerio.load(html);

  return extractStructured($, url, domain) ?? extractBestEffort($, url, domain);
}
