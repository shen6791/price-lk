import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

export default async function DataQualityPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  const supabase = createServiceClient();
  const [{ count: totalPrices }, { count: suspiciouslyCheap }, { count: staleCount }] =
    await Promise.all([
      supabase.from("prices").select("*", { count: "exact", head: true }),
      supabase.from("prices").select("*", { count: "exact", head: true }).lt("price", 100),
      supabase
        .from("prices")
        .select("*", { count: "exact", head: true })
        .lt("recorded_at", new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <a href="/admin" className="text-sm text-blue-600 hover:underline">
          ← Admin
        </a>
        <h1 className="mt-2 text-lg font-bold text-zinc-900 dark:text-zinc-50">Data quality</h1>
        <p className="mt-1 text-xs text-zinc-500">
          A starting point, not the full spec — no duplicate-product detection, broken-URL
          checking, or product-mismatch detection yet (those need a background job actually
          re-visiting stored URLs, which isn&apos;t built).
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {totalPrices ?? 0}
            </p>
            <p className="text-xs text-zinc-500">Total recorded price observations</p>
          </div>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
            <p className="text-2xl font-bold text-amber-600">{suspiciouslyCheap ?? 0}</p>
            <p className="text-xs text-zinc-500">
              Suspiciously cheap (&lt; Rs. 100) — likely extraction errors
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
            <p className="text-2xl font-bold text-amber-600">{staleCount ?? 0}</p>
            <p className="text-xs text-zinc-500">Observations older than 3 days (stale)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
