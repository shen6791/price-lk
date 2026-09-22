import Link from "next/link";
import { Suspense } from "react";
import SearchResults from "./SearchResults";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
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
          <p className="mt-2 text-xs text-zinc-400">
            Nothing is pre-loaded — every search checks seller sites live, on the spot.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {q ? (
          <Suspense key={q} fallback={<SearchFallback q={q} />}>
            <SearchResults q={q} />
          </Suspense>
        ) : (
          <p className="text-sm text-zinc-500">
            Search for a phone, laptop, or accessory above to see live prices from Sri Lankan
            sellers.
          </p>
        )}
      </main>
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
          Browsing Celltronics, Wasi.lk and SimplyTek for &quot;{q}&quot;…
        </p>
      </div>
    </div>
  );
}
