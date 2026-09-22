import { liveSearch } from "@/lib/live-search";

function formatLKR(n: number) {
  return `Rs. ${n.toLocaleString("en-LK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const SELLER_NAMES: Record<string, string> = {
  celltronics: "Celltronics.lk",
  wasi: "Wasi.lk",
  simplytek: "SimplyTek",
  buyabans: "Buyabans",
};

export default async function SearchResults({ q }: { q: string }) {
  let groups: Awaited<ReturnType<typeof liveSearch>>["groups"] = [];
  let listingCount = 0;
  let failed = false;

  try {
    ({ groups, listingCount } = await liveSearch(q));
  } catch {
    failed = true;
  }

  if (failed) {
    return (
      <p className="text-zinc-500">
        Couldn&apos;t reach seller sites just now — please try searching again in a moment.
      </p>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Results for &quot;{q}&quot;
        </h2>
        <p className="text-xs text-zinc-400">
          {listingCount > 0
            ? `Checked ${listingCount} live listing${listingCount === 1 ? "" : "s"} across sellers just now`
            : "No live listings found for this search"}
        </p>
      </div>

      {groups.length === 0 ? (
        <p className="text-zinc-500">
          No products found — try a different spelling or a more general term.
        </p>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => {
            const sorted = [...g.listings].sort((a, b) => a.price - b.price);
            const inStock = sorted.filter((l) => l.inStock);
            const lowest = (inStock.length > 0 ? inStock : sorted)[0];

            return (
              <div
                key={g.key}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{g.name}</h3>
                  <span className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                    {formatLKR(lowest.price)}
                    <span className="ml-1 text-xs font-normal text-zinc-500">lowest</span>
                  </span>
                </div>

                <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[420px] text-sm">
                  <thead className="text-left text-zinc-500">
                    <tr>
                      <th className="py-1 font-medium">Seller</th>
                      <th className="py-1 font-medium">Price</th>
                      <th className="py-1 font-medium">Availability</th>
                      <th className="py-1 font-medium" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                    {sorted.map((l, i) => (
                      <tr key={i}>
                        <td className="py-1.5 text-zinc-700 dark:text-zinc-300">
                          {SELLER_NAMES[l.sellerSlug] ?? l.sellerSlug}
                        </td>
                        <td className="py-1.5 text-zinc-900 dark:text-zinc-100">
                          {formatLKR(l.price)}
                        </td>
                        <td className="py-1.5">
                          {l.inStock ? (
                            <span className="text-green-600">In stock</span>
                          ) : (
                            <span className="text-red-500">Out of stock</span>
                          )}
                        </td>
                        <td className="py-1.5 text-right">
                          <a
                            href={l.productUrl}
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
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
