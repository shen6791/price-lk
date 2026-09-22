import { createClient } from "@/lib/supabase/server";
import { scrapeAllSellers } from "@/lib/scrapers";
import { upsertScrapedResults } from "@/lib/scrapers/upsert";
import type { Category, Price, Product, Seller } from "@/lib/types";

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");
  return data ?? [];
}

export type ProductListItem = Product & {
  lowest_price: number | null;
  seller_count: number;
};

export async function getProducts(search?: string): Promise<ProductListItem[]> {
  const supabase = await createClient();
  let query = supabase.from("products").select("*, prices(price, in_stock)");
  if (search) {
    query = query.ilike("name", `%${search}%`);
  }
  const { data } = await query;
  if (!data) return [];

  return data.map((p: any) => {
    const inStockPrices = (p.prices ?? []).filter((pr: any) => pr.in_stock);
    const pool = inStockPrices.length > 0 ? inStockPrices : p.prices ?? [];
    const lowest = pool.length > 0 ? Math.min(...pool.map((pr: any) => pr.price)) : null;
    return {
      ...p,
      prices: undefined,
      lowest_price: lowest,
      seller_count: p.prices?.length ?? 0,
    };
  });
}

// Searches the DB, and also scrapes seller sites live for this query so
// results include prices we've never stored before. Scraped results are
// persisted (see upsertScrapedResults) so the next search / product page is
// instant and has history.
function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function searchProducts(query: string): Promise<{
  products: ProductListItem[];
  scrapedCount: number;
}> {
  const scraped = await scrapeAllSellers(query);
  await upsertScrapedResults(scraped);

  const scrapedSlugs = [...new Set(scraped.map((r) => slugify(r.productName)))].filter(Boolean);

  const supabase = await createClient();
  let dbQuery = supabase.from("products").select("*, prices(price, in_stock)");
  dbQuery =
    scrapedSlugs.length > 0
      ? dbQuery.or(`name.ilike.%${query}%,slug.in.(${scrapedSlugs.join(",")})`)
      : dbQuery.ilike("name", `%${query}%`);
  const { data } = await dbQuery;

  const products = (data ?? []).map((p: any) => {
    const inStockPrices = (p.prices ?? []).filter((pr: any) => pr.in_stock);
    const pool = inStockPrices.length > 0 ? inStockPrices : p.prices ?? [];
    const lowest = pool.length > 0 ? Math.min(...pool.map((pr: any) => pr.price)) : null;
    return {
      ...p,
      prices: undefined,
      lowest_price: lowest,
      seller_count: p.prices?.length ?? 0,
    } as ProductListItem;
  });

  return { products, scrapedCount: scraped.length };
}

export async function getProductBySlug(slug: string) {
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!product) return null;

  const { data: prices } = await supabase
    .from("prices")
    .select("*, seller:sellers(*)")
    .eq("product_id", product.id)
    .order("price", { ascending: true });

  return { product: product as Product, prices: (prices ?? []) as (Price & { seller: Seller })[] };
}
