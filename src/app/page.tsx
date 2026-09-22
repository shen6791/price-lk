import Link from "next/link";
import { Suspense } from "react";
import SearchResults from "./SearchResults";
import { CATEGORIES } from "@/lib/categories";
import { SELLERS } from "@/lib/scrapers";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim();
  const tooShort = !!query && query.length < 2;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <Link href="/" className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            price<span className="text-blue-600">.lk</span>
          </Link>
          <p className="mt-1 text-sm text-zinc-500">
            Type a product — we browse Sri Lankan sellers live and show you the price.
          </p>
          <form action="/" className="mt-4">
            <div className="relative">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="e.g. Apple iPhone SE 2"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 pr-24 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Search
              </button>
            </div>
          </form>

          <div className="mt-3 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Link
                key={c.query}
                href={`/?q=${encodeURIComponent(c.query)}`}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  query === c.query
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-blue-500 hover:text-blue-600"
                }`}
              >
                {c.label}
              </Link>
            ))}
          </div>

          <p className="mt-3 text-xs text-zinc-400">
            Nothing is pre-loaded — every search checks {SELLERS.length} Sri Lankan seller sites
            live, on the spot.
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {!query ? (
          <p className="text-sm text-zinc-500">
            Search for a phone, laptop, or accessory above — or pick a category — to see live
            prices from Sri Lankan sellers.
          </p>
        ) : tooShort ? (
          <p className="text-sm text-zinc-500">Type at least 2 characters to search.</p>
        ) : (
          <Suspense key={query} fallback={<SearchFallback q={query} />}>
            <SearchResults q={query} />
          </Suspense>
        )}
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-6 text-center text-xs text-zinc-400">
        Prices are fetched live from seller sites and may change or be inaccurate — always
        confirm the final price and availability on the seller&apos;s own site before buying.
        price.lk is not affiliated with any seller listed.
      </footer>
    </div>
  );
}

function SearchFallback({ q }: { q: string }) {
  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Results for &quot;{q}&quot;
      </h2>
      <div className="flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <p className="text-sm text-zinc-500">
          Browsing Sri Lankan sellers for &quot;{q}&quot;…
        </p>
      </div>
    </div>
  );
}
