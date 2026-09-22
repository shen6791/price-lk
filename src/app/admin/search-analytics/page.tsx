import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

export default async function SearchAnalyticsPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  const supabase = createServiceClient();
  const { data: recent } = await supabase
    .from("search_queries")
    .select("*")
    .order("searched_at", { ascending: false })
    .limit(50);

  const counts = new Map<string, number>();
  for (const r of recent ?? []) {
    counts.set(r.query, (counts.get(r.query) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <a href="/admin" className="text-sm text-blue-600 hover:underline">
          ← Admin
        </a>
        <h1 className="mt-2 text-lg font-bold text-zinc-900 dark:text-zinc-50">
          Search analytics
        </h1>
        <p className="mt-1 text-xs text-zinc-500">
          Based on the last 50 logged searches — this is a starting point, not a full analytics
          system (no date range picker, no export, no zero-result tracking yet).
        </p>

        <h2 className="mt-6 mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Top queries (recent)
        </h2>
        <ul className="space-y-1 text-sm">
          {top.map(([q, count]) => (
            <li key={q} className="flex justify-between border-b border-zinc-200 dark:border-zinc-800 py-1">
              <span className="text-zinc-900 dark:text-zinc-100">{q}</span>
              <span className="text-zinc-500">{count}×</span>
            </li>
          ))}
          {top.length === 0 && <li className="text-zinc-500">No searches logged yet.</li>}
        </ul>
      </div>
    </div>
  );
}
