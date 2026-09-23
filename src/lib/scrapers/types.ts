export type ScrapedPrice = {
  productName: string;
  price: number;
  inStock: boolean;
  productUrl: string;
  sellerSlug: string;
  // Absent = one of the dedicated site-specific scrapers (Celltronics,
  // Wasi, SimplyTek, Buyabans) — extraction matches that site's known page
  // structure. "structured" = a generic web-search hit with valid
  // JSON-LD/OpenGraph product data. "best-effort" = no structured data
  // found; price/stock were guessed from visible page text and may be
  // wrong — always show this distinction to the user, never hide it.
  confidence?: "structured" | "best-effort";
};
