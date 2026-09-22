import SiteHeader from "../SiteHeader";
import SiteFooter from "../SiteFooter";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Stores — SmartTech Finder" };

export default async function StoresPage() {
  const supabase = await createClient();
  const { data: sellers } = await supabase.from("sellers").select("*").order("name");

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Stores we check
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          These are public web sources SmartTech Finder discovers listings from — not
          registered sellers or partners. There is no store account or dashboard; we simply
          browse their public pages and link you back to the original listing.
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sellers?.map((s) => (
            <a
              key={s.id}
              href={s.website}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 hover:border-blue-500"
            >
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{s.name}</p>
              <p className="text-xs text-zinc-500">{s.website}</p>
            </a>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
