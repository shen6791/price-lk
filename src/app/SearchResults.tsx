import { liveSearch } from "@/lib/live-search";
import ResultsView from "./ResultsView";

export default async function SearchResults({ q }: { q: string }) {
  let results: Awaited<ReturnType<typeof liveSearch>>["results"] = [];
  let listingCount = 0;
  let fromCache = false;
  let failed = false;

  try {
    ({ results, listingCount, fromCache } = await liveSearch(q));
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
          {listingCount === 0
            ? "No live listings found for this search"
            : fromCache
              ? `${listingCount} listing${listingCount === 1 ? "" : "s"} — from a search moments ago`
              : `Checked ${listingCount} live listing${listingCount === 1 ? "" : "s"} across sellers just now`}
        </p>
      </div>

      {results.length === 0 ? (
        <p className="text-zinc-500">
          No products found — try a different spelling or a more general term.
        </p>
      ) : (
        <ResultsView results={results} />
      )}
    </>
  );
}
