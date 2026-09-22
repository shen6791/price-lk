import { Suspense } from "react";
import SiteHeader from "../SiteHeader";
import SiteFooter from "../SiteFooter";
import { liveSearch } from "@/lib/live-search";

export const metadata = { title: "Compare — SmartTech Finder" };

function formatLKR(n: number) {
  return `Rs. ${n.toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;
}

async function CompareSlot({ term }: { term?: string }) {
  if (!term) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-4 text-center text-sm text-zinc-400">
        Enter a product to compare
      </div>
    );
  }

  let best: Awaited<ReturnType<typeof liveSearch>>["results"][number] | undefined;
  try {
    const { results } = await liveSearch(term);
    best = results[0];
  } catch {
    return <p className="text-sm text-red-500">Couldn&apos;t search for &quot;{term}&quot;.</p>;
  }

  if (!best) {
    return <p className="text-sm text-zinc-500">No listing found for &quot;{term}&quot;.</p>;
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
      <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{best.productName}</h3>
      <p className="mt-2 text-2xl font-bold text-blue-700 dark:text-blue-400">
        {formatLKR(best.price)}
      </p>
      <p className="mt-1 text-sm">
        {best.inStock ? (
          <span className="text-green-600">In stock</span>
        ) : (
          <span className="text-red-500">Out of stock</span>
        )}
      </p>
      <p className="mt-1 text-xs text-zinc-500 capitalize">from {best.sellerSlug}</p>
      <a
        href={best.productUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-sm text-blue-600 hover:underline"
      >
        View listing
      </a>
    </div>
  );
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string; c?: string }>;
}) {
  const { a, b, c } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Compare products</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Shows each search&apos;s single best live match side by side — price and availability
          only for now. Full spec comparison (display, processor, camera, etc.) needs structured
          spec extraction we don&apos;t have yet; see the README roadmap.
        </p>

        <form action="/compare" className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            name="a"
            defaultValue={a}
            placeholder="e.g. iPhone 17 Pro Max"
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
          />
          <input
            name="b"
            defaultValue={b}
            placeholder="e.g. Samsung Galaxy S26 Ultra"
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
          />
          <input
            name="c"
            defaultValue={c}
            placeholder="e.g. Google Pixel 10"
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
          />
          <button className="sm:col-span-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Compare
          </button>
        </form>

        {(a || b || c) && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Suspense fallback={<p className="text-sm text-zinc-500">Searching…</p>}>
              <CompareSlot term={a} />
            </Suspense>
            <Suspense fallback={<p className="text-sm text-zinc-500">Searching…</p>}>
              <CompareSlot term={b} />
            </Suspense>
            <Suspense fallback={<p className="text-sm text-zinc-500">Searching…</p>}>
              <CompareSlot term={c} />
            </Suspense>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
