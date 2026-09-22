import SiteHeader from "../SiteHeader";
import SiteFooter from "../SiteFooter";

export const metadata = { title: "About — SmartTech Finder" };

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 text-sm text-zinc-700 dark:text-zinc-300 space-y-4">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          What SmartTech Finder is
        </h1>
        <p>
          SmartTech Finder is <strong>not an e-commerce marketplace</strong>. We don&apos;t sell
          anything, and stores don&apos;t register accounts or manage listings here. Every price
          you see is discovered by checking a small set of Sri Lankan retailer websites directly,
          at the moment you search.
        </p>
        <p>
          When you click a result, you leave SmartTech Finder and go to the store&apos;s own
          page to buy — we never take payment or claim to be the seller.
        </p>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 pt-2">
          What we can promise
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Every price shown was checked live, or cached from a check a few minutes ago.</li>
          <li>We only show &quot;In Stock&quot; when the store&apos;s page actually said so.</li>
          <li>We link you to the original listing so you can verify before buying.</li>
        </ul>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 pt-2">
          What we can&apos;t promise yet
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Coverage: we currently check a handful of stores, not every retailer in Sri Lanka.
          </li>
          <li>
            &quot;AI Tech Finder&quot; uses simple keyword/budget parsing today, not a full
            language-model assistant.
          </li>
          <li>
            The same phone listed differently by two stores may currently show as two separate
            rows rather than being merged.
          </li>
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
