import { createServiceClient } from "@/lib/supabase/server";
import type { ScrapedPrice } from "./types";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const STALE_MS = 6 * 60 * 60 * 1000; // re-check a seller's price at most every 6h

// Persists freshly scraped results: creates products that don't exist yet,
// auto-registers a seller/source row for domains discovered via web search
// that aren't one of the dedicated scrapers, and only writes a new price
// row when the price changed or the last check is stale, so repeat
// searches for the same term don't spam the prices table.
export async function upsertScrapedResults(results: ScrapedPrice[]) {
  if (results.length === 0) return;
  const supabase = createServiceClient();

  const { data: sellers } = await supabase.from("sellers").select("id, slug");
  const sellerBySlug = new Map((sellers ?? []).map((s: any) => [s.slug, s.id]));

  for (const r of results) {
    let sellerId = sellerBySlug.get(r.sellerSlug);
    if (!sellerId) {
      // Not one of the 4 dedicated scrapers — this is a domain discovered
      // via web search (r.sellerSlug is a hostname). Register it as a
      // source so its price history accumulates too, same as any other
      // seller — see spec section 21: this is not a seller account, just
      // an internal record to organize discovered information.
      const { data: created } = await supabase
        .from("sellers")
        .upsert(
          { name: r.sellerSlug, slug: r.sellerSlug, website: `https://${r.sellerSlug}` },
          { onConflict: "slug", ignoreDuplicates: false }
        )
        .select("id")
        .single();
      if (!created) continue;
      sellerId = created.id;
      sellerBySlug.set(r.sellerSlug, sellerId);
    }

    const slug = slugify(r.productName);
    if (!slug) continue;

    const { data: product } = await supabase
      .from("products")
      .upsert({ name: r.productName, slug }, { onConflict: "slug", ignoreDuplicates: false })
      .select("id")
      .single();
    if (!product) continue;

    const { data: existing } = await supabase
      .from("prices")
      .select("price, recorded_at")
      .eq("product_id", product.id)
      .eq("seller_id", sellerId)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const isStale =
      !existing || Date.now() - new Date(existing.recorded_at).getTime() > STALE_MS;
    const priceChanged = existing && Number(existing.price) !== r.price;

    if (!existing || isStale || priceChanged) {
      await supabase.from("prices").insert({
        product_id: product.id,
        seller_id: sellerId,
        price: r.price,
        in_stock: r.inStock,
        product_url: r.productUrl,
        source: "scraper",
        status: r.confidence === "best-effort" ? "needs_verification" : "verified",
      });
    }
  }
}
