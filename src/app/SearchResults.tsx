import Link from "next/link";
import { getProducts, searchProducts } from "@/lib/queries";

function formatLKR(n: number) {
  return `Rs. ${n.toLocaleString("en-LK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default async function SearchResults({ q }: { q?: string }) {
  const { products, scrapedCount } = q
    ? await searchProducts(q)
    : { products: await getProducts(), scrapedCount: 0 };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {q ? `Results for "${q}"` : "All products"}
        </h2>
        {q && (
          <p className="text-xs text-zinc-400">
            {scrapedCount > 0
              ? `Checked ${scrapedCount} live listing${scrapedCount === 1 ? "" : "s"} across sellers just now`
              : "No live listings found for this search"}
          </p>
        )}
      </div>

      {products.length === 0 ? (
        <p className="text-zinc-500">
          No products found{q ? " — try a different spelling or a more general term." : "."}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.slug}`}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 hover:border-blue-500 transition-colors"
            >
              <p className="text-xs text-zinc-500">{p.brand}</p>
              <h3 className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">{p.name}</h3>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {p.lowest_price ? formatLKR(p.lowest_price) : "No price yet"}
                </span>
                <span className="text-xs text-zinc-500">{p.seller_count} sellers</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
