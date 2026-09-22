"use client";

import { useMemo, useState } from "react";
import type { LiveResultGroup } from "@/lib/live-search";

function formatLKR(n: number) {
  return `Rs. ${n.toLocaleString("en-LK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const SELLER_NAMES: Record<string, string> = {
  celltronics: "Celltronics.lk",
  wasi: "Wasi.lk",
  simplytek: "SimplyTek",
  buyabans: "Buyabans",
};

type SortMode = "relevance" | "price-asc" | "price-desc";

function lowestOf(g: LiveResultGroup) {
  const sorted = [...g.listings].sort((a, b) => a.price - b.price);
  const inStock = sorted.filter((l) => l.inStock);
  return (inStock.length > 0 ? inStock : sorted)[0];
}

export default function ResultsView({ groups }: { groups: LiveResultGroup[] }) {
  const [sort, setSort] = useState<SortMode>("relevance");
  const [inStockOnly, setInStockOnly] = useState(false);

  const visible = useMemo(() => {
    let list = groups;
    if (inStockOnly) {
      list = list.filter((g) => g.listings.some((l) => l.inStock));
    }
    if (sort === "price-asc") {
      list = [...list].sort((a, b) => lowestOf(a).price - lowestOf(b).price);
    } else if (sort === "price-desc") {
      list = [...list].sort((a, b) => lowestOf(b).price - lowestOf(a).price);
    }
    return list;
  }, [groups, sort, inStockOnly]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-zinc-500">
          Sort by
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100"
          >
            <option value="relevance">Best match</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-zinc-500">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
          />
          In stock only
        </label>
        {inStockOnly && visible.length !== groups.length && (
          <span className="text-xs text-zinc-400">
            Showing {visible.length} of {groups.length}
          </span>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="text-zinc-500">Nothing in stock right now — try clearing the filter.</p>
      ) : (
        <div className="space-y-4">
          {visible.map((g) => {
            const sorted = [...g.listings].sort((a, b) => a.price - b.price);
            const lowest = lowestOf(g);

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
