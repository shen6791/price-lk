import SiteHeader from "../SiteHeader";
import SiteFooter from "../SiteFooter";
import { createAlert } from "./actions";

export const metadata = { title: "Price Alerts — SmartTech Finder" };

export default async function PriceAlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string; query?: string }>;
}) {
  const { created, error, query } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <SiteHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-8">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Price alerts</h1>
        <p className="mt-1 text-sm text-zinc-500">
          We&apos;ll save your alert now. Sending an email/notification when a matching price is
          seen isn&apos;t wired up yet — that needs a background job checking alerts on a
          schedule, which is a Phase 3/4 item. For now this stores the alert so that piece can
          be built without changing this form.
        </p>

        {created && (
          <p className="mt-4 rounded-md bg-green-50 dark:bg-green-950/40 px-3 py-2 text-sm text-green-700">
            Alert saved.
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-md bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm text-red-600">
            Please fill in all fields.
          </p>
        )}

        <form action={createAlert} className="mt-4 space-y-3">
          <input
            name="query"
            defaultValue={query}
            placeholder="Product, e.g. Samsung Galaxy A56 5G 256GB"
            required
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
          />
          <input
            name="target_price"
            type="number"
            step="0.01"
            placeholder="Target price (LKR)"
            required
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
          />
          <input
            name="email"
            type="email"
            placeholder="Your email"
            required
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
          />
          <button className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Create alert
          </button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
