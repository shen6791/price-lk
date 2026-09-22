"use client";

import { useMemo, useState } from "react";
import type { LiveResult } from "@/lib/live-search";

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

export default function ResultsView({ results }: { results: LiveResult[] }) {
  const [sort, setSort] = useState<SortMode>("relevance");
  const [inStockOnly, setInStockOnly] = useState(false);

  const visible = useMemo(() => {
    let list = inStockOnly ? results.filter((r) => r.inStock) : results;
    if (sort === "price-asc") {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sort === "price-desc") {
      list = [...list].sort((a, b) => b.price - a.price);
    }
    return list;
  }, [results, sort, inStockOnly]);

  const lowest = results.length > 0 ? Math.min(...results.map((r) => r.price)) : null;

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
        {inStockOnly && visible.length !== results.length && (
          <span className="text-xs text-zinc-400">
            Showing {visible.length} of {results.length}
          </span>
        )}
        {lowest !== null && (
          <span className="ml-auto text-sm text-zinc-500">
            Cheapest found:{" "}
            <span className="font-semibold text-blue-700 dark:text-blue-400">
              {formatLKR(lowest)}
            </span>
          </span>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="text-zinc-500">Nothing in stock right now — try clearing the filter.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-zinc-100 dark:bg-zinc-900 text-left text-zinc-500">
              <tr>
                <th className="px-4 py-2 font-medium">Product</th>
                <th className="px-4 py-2 font-medium">Seller</th>
                <th className="px-4 py-2 font-medium">Price</th>
                <th className="px-4 py-2 font-medium">Availability</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 bg-white dark:bg-zinc-950">
              {visible.map((r, i) => (
                <tr key={i} className={r.price === lowest ? "bg-blue-50 dark:bg-blue-950/30" : undefined}>
                  <td className="px-4 py-2 text-zinc-900 dark:text-zinc-100">{r.productName}</td>
                  <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                    {SELLER_NAMES[r.sellerSlug] ?? r.sellerSlug}
                  </td>
                  <td className="px-4 py-2 font-medium text-zinc-900 dark:text-zinc-100">
                    {formatLKR(r.price)}
                  </td>
                  <td className="px-4 py-2">
                    {r.inStock ? (
                      <span className="text-green-600">In stock</span>
                    ) : (
                      <span className="text-red-500">Out of stock</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <a
                      href={r.productUrl}
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
    </>
  );
}
