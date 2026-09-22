import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/queries";

function formatLKR(n: number) {
  return `Rs. ${n.toLocaleString("en-LK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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

  const inStock = prices.filter((p) => p.in_stock);
  const lowest = (inStock.length > 0 ? inStock : prices)[0];
  const highest = prices[prices.length - 1];
  const diff = highest && lowest ? highest.price - lowest.price : 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Link href="/" className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            price<span className="text-blue-600">.lk</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-zinc-500">{product.brand}</p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{product.name}</h1>

        {lowest && (
          <div className="mt-6 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 p-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Lowest price</p>
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
              {formatLKR(lowest.price)}
            </p>
            {diff > 0 && (
              <p className="mt-1 text-sm text-zinc-500">
                Price difference across sellers: {formatLKR(diff)}
              </p>
            )}
          </div>
        )}

        <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Compare prices
        </h2>
        {prices.length === 0 ? (
          <p className="text-zinc-500">No prices recorded yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-100 dark:bg-zinc-900 text-left text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Seller</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Availability</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
                {prices.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      {p.seller?.name}
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
                    <td className="px-4 py-3 text-zinc-500">
                      {p.status === "verified" && "✓ Verified"}
                      {p.status === "user_submitted" && "👤 User submitted"}
                      {p.status === "needs_verification" && "⚠️ Needs verification"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={p.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Visit
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-zinc-400">
          Prices last checked {new Date(prices[0]?.recorded_at ?? Date.now()).toLocaleDateString("en-LK")}.
          Always confirm the final price on the seller&apos;s site before buying.
        </p>
      </main>
    </div>
  );
}
