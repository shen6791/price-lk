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

// Ranks candidates by trigram/word similarity to the query (see
// supabase/migrations/0001_search_ranking.sql) so "iphone 11" surfaces
// iPhone 11 listings first instead of an arbitrary-order substring match
// that mixes in loosely related accessories.
async function getRankedProducts(query: string, limit = 40): Promise<ProductListItem[]> {
  const supabase = await createClient();
  const { data: ranked } = await supabase.rpc("search_products_ranked", {
    search_query: query,
    match_limit: limit,
  });
  if (!ranked || ranked.length === 0) return [];

  const rank = new Map<string, number>(ranked.map((r: any, i: number) => [r.id, i]));
  const { data } = await supabase
    .from("products")
    .select("*, prices(price, in_stock)")
    .in(
      "id",
      ranked.map((r: any) => r.id)
    );

  return (data ?? [])
    .sort((a: any, b: any) => (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999))
    .map((p: any) => {
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
}

// Scrapes seller sites live for this query so results include prices we've
// never stored before (persisted via upsertScrapedResults, so the next
// search / product page is instant and has history), then returns the DB's
// best matches for the query — now including whatever was just scraped.
export async function searchProducts(query: string): Promise<{
  products: ProductListItem[];
  scrapedCount: number;
}> {
  const scraped = await scrapeAllSellers(query);
  await upsertScrapedResults(scraped);

  const products = await getRankedProducts(query);
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
