import { liveSearch } from "@/lib/live-search";
import ResultsView from "./ResultsView";

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
        <ResultsView groups={groups} />
      )}
    </>
  );
}
