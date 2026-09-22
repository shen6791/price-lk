import { Suspense } from "react";
import SiteHeader from "../SiteHeader";
import SiteFooter from "../SiteFooter";
import { parseNaturalQuery } from "@/lib/ai-query";
import { liveSearch } from "@/lib/live-search";
import ResultsView from "../ResultsView";

export const metadata = { title: "AI Tech Finder — SmartTech Finder" };

const EXAMPLES = [
  "gaming laptop under 200k",
  "iPhone under 300k",
  "Samsung phones under 150k",
  "cheapest power bank",
];

async function AiResults({ q }: { q: string }) {
  const parsed = parseNaturalQuery(q);

  let results: Awaited<ReturnType<typeof liveSearch>>["results"] = [];
  try {
    ({ results } = await liveSearch(parsed.searchTerm));
  } catch {
    return (
      <p className="text-zinc-500">Couldn&apos;t reach seller sites just now — try again.</p>
    );
  }

  const filtered =
    parsed.maxPrice !== null ? results.filter((r) => r.price <= parsed.maxPrice!) : results;

  return (
    <>
      <div className="mb-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 p-3 text-xs text-zinc-600 dark:text-zinc-400">
        Understood as: search <strong>&quot;{parsed.searchTerm}&quot;</strong>
        {parsed.maxPrice !== null && (
          <>
            {" "}
            under <strong>Rs. {parsed.maxPrice.toLocaleString("en-LK")}</strong>
          </>
        )}
        {parsed.category && (
          <>
            {" "}
            in category <strong>{parsed.category}</strong>
          </>
        )}
        . This is keyword parsing, not a full AI assistant — see the About page.
      </div>
      {filtered.length === 0 ? (
        <p className="text-zinc-500">Nothing matched that budget — try a higher amount.</p>
      ) : (
        <ResultsView results={filtered} />
      )}
    </>
  );
}

export default async function AiFinderPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">AI Tech Finder</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Describe what you need in plain words — budget and category are picked out
          automatically.
        </p>

        <form action="/ai-finder" className="mt-4">
          <input
            name="q"
            defaultValue={q}
            placeholder="e.g. gaming laptop under 200k"
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Find it
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <a
              key={ex}
              href={`/ai-finder?q=${encodeURIComponent(ex)}`}
              className="rounded-full border border-zinc-300 dark:border-zinc-700 px-3 py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:border-blue-500 hover:text-blue-600"
            >
              {ex}
            </a>
          ))}
        </div>

        <div className="mt-8">
          {query ? (
            <Suspense fallback={<p className="text-sm text-zinc-500">Thinking…</p>}>
              <AiResults q={query} />
            </Suspense>
          ) : (
            <p className="text-sm text-zinc-500">
              Try one of the examples above, or type your own.
            </p>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
