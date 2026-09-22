import Link from "next/link";
import { getProducts } from "@/lib/queries";

function formatLKR(n: number) {
  return `Rs. ${n.toLocaleString("en-LK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const products = await getProducts(q);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <Link href="/" className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            price<span className="text-blue-600">.lk</span>
          </Link>
          <p className="mt-1 text-sm text-zinc-500">
            Know the real price before you buy — compare Sri Lankan retailers in one place.
          </p>
          <form action="/" className="mt-4">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search for a phone, laptop, or accessory…"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {q ? `Results for "${q}"` : "All products"}
        </h2>

        {products.length === 0 ? (
          <p className="text-zinc-500">No products found.</p>
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
      </main>
    </div>
  );
}
