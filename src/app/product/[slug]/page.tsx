import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/queries";
import { freshnessLabel } from "@/lib/freshness";
import SiteHeader from "../../SiteHeader";
import SiteFooter from "../../SiteFooter";

function formatLKR(n: number) {
  return `Rs. ${n.toLocaleString("en-LK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function sparklinePath(values: number[], width: number, height: number) {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getProductBySlug(slug);
  if (!result) notFound();
  const { product, prices } = result;

  // Latest observation per seller = the "current" listing for that store.
  const latestBySeller = new Map<string, (typeof prices)[number]>();
  for (const p of prices) {
    const existing = latestBySeller.get(p.seller_id);
    if (!existing || new Date(p.recorded_at) > new Date(existing.recorded_at)) {
      latestBySeller.set(p.seller_id, p);
    }
  }
  const current = [...latestBySeller.values()].sort((a, b) => a.price - b.price);
  const inStockCurrent = current.filter((p) => p.in_stock);
  const lowest = (inStockCurrent.length > 0 ? inStockCurrent : current)[0];

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = prices.filter((p) => new Date(p.recorded_at).getTime() >= thirtyDaysAgo);
  const recentPrices = recent.map((p) => p.price);
  const stats =
    recentPrices.length > 0
      ? {
          low: Math.min(...recentPrices),
          high: Math.max(...recentPrices),
          avg: recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length,
        }
      : null;

  const sparkValues = [...prices]
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .map((p) => p.price);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <p className="text-sm text-zinc-500">{product.brand}</p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{product.name}</h1>

        {lowest && (
          <div className="mt-6 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 p-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Lowest observed price</p>
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
              {formatLKR(lowest.price)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Prices observed by SmartTech Finder — not necessarily every price in the Sri
              Lankan market.
            </p>
            <Link
              href={`/price-alerts?query=${encodeURIComponent(product.name)}`}
              className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline"
            >
              Set a price alert →
            </Link>
          </div>
        )}

        {stats && (
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
              <p className="text-xs text-zinc-500">30-day lowest</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                {formatLKR(stats.low)}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
              <p className="text-xs text-zinc-500">30-day average</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                {formatLKR(Math.round(stats.avg))}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
              <p className="text-xs text-zinc-500">30-day highest</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                {formatLKR(stats.high)}
              </p>
            </div>
          </div>
        )}

        {sparkValues.length >= 2 && (
          <div className="mt-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
            <p className="mb-2 text-xs text-zinc-500">Price history ({sparkValues.length} observations)</p>
            <svg viewBox="0 0 300 60" className="w-full h-14" preserveAspectRatio="none">
              <path
                d={sparklinePath(sparkValues, 300, 60)}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="text-blue-600"
              />
            </svg>
          </div>
        )}

        <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Compare current prices
        </h2>
        {current.length === 0 ? (
          <p className="text-zinc-500">No prices recorded yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-100 dark:bg-zinc-900 text-left text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Seller</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Availability</th>
                  <th className="px-4 py-3 font-medium">Freshness</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
                {current.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      {p.seller?.name}
                      {p.status === "needs_verification" && (
                        <span
                          title="Guessed from page text, no structured product data — double-check before trusting it"
                          className="ml-1.5 rounded bg-amber-100 dark:bg-amber-950/50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400"
                        >
                          unverified
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                      {formatLKR(p.price)}
                    </td>
                    <td className="px-4 py-3">
                      {p.in_stock ? (
                        <span className="text-green-600">In stock</span>
                      ) : (
                        <span className="text-red-500">Out of stock</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{freshnessLabel(p.recorded_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={p.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View store
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
