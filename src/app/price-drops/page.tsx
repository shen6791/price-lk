import SiteHeader from "../SiteHeader";
import SiteFooter from "../SiteFooter";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Price Drops — SmartTech Finder" };

function formatLKR(n: number) {
  return `Rs. ${Number(n).toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;
}

export default async function PriceDropsPage() {
  const supabase = await createClient();
  const { data: drops, error } = await supabase.rpc("recent_price_drops", { drop_limit: 20 });

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Biggest observed price drops
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Computed from prices SmartTech Finder has actually observed over repeat searches —
          not every price change in the market, only ones we happened to see.
        </p>

        {error && (
          <p className="mt-6 text-sm text-red-500">Couldn&apos;t load price drops right now.</p>
        )}

        {!error && (!drops || drops.length === 0) && (
          <p className="mt-6 text-sm text-zinc-500">
            No price drops observed yet — this fills in as the same products get searched more
            than once over time. Try searching a few products first.
          </p>
        )}

        {drops && drops.length > 0 && (
          <div className="mt-6 space-y-3">
            {drops.map((d: any, i: number) => (
              <div
                key={i}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4"
              >
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {d.product_name}
                  </p>
                  <p className="text-xs text-zinc-500">{d.seller_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-zinc-400 line-through">
                    {formatLKR(d.old_price)}
                  </p>
                  <p className="font-semibold text-green-600">
                    {formatLKR(d.new_price)}{" "}
                    <span className="text-xs">(-{d.drop_percent}%)</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
