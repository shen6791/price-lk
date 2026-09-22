import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { createProduct, createSeller, addPrice, logout } from "@/app/admin/actions";

function formatLKR(n: number) {
  return `Rs. ${n.toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;
}

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  const supabase = createServiceClient();
  const [{ data: products }, { data: sellers }, { data: categories }, { data: prices }] =
    await Promise.all([
      supabase.from("products").select("*").order("name"),
      supabase.from("sellers").select("*").order("name"),
      supabase.from("categories").select("*").order("sort_order"),
      supabase
        .from("prices")
        .select("*, product:products(name), seller:sellers(name)")
        .order("recorded_at", { ascending: false })
        .limit(20),
    ]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            price<span className="text-blue-600">.lk</span> admin
          </h1>
          <form action={logout}>
            <button className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
              Log out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 space-y-10">
        {/* Add seller */}
        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Add seller</h2>
          <form action={createSeller} className="mt-3 flex flex-wrap gap-3">
            <input
              name="name"
              placeholder="Seller name (e.g. Celltronics.lk)"
              required
              className="flex-1 min-w-[200px] rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            />
            <input
              name="website"
              placeholder="https://..."
              required
              className="flex-1 min-w-[200px] rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            />
            <button className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900">
              Add
            </button>
          </form>
        </section>

        {/* Add product */}
        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Add product</h2>
          <form action={createProduct} className="mt-3 flex flex-wrap gap-3">
            <input
              name="name"
              placeholder="Product name (e.g. Samsung Galaxy A56 5G 8GB/256GB)"
              required
              className="flex-1 min-w-[240px] rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            />
            <input
              name="brand"
              placeholder="Brand"
              className="w-40 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            />
            <select
              name="category_id"
              className="w-40 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            >
              <option value="">Category…</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900">
              Add
            </button>
          </form>
        </section>

        {/* Add price */}
        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Record a price</h2>
          <form action={addPrice} className="mt-3 flex flex-wrap items-center gap-3">
            <select
              name="product_id"
              required
              className="flex-1 min-w-[200px] rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            >
              <option value="">Product…</option>
              {products?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              name="seller_id"
              required
              className="w-48 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            >
              <option value="">Seller…</option>
              {sellers?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              name="price"
              type="number"
              step="0.01"
              placeholder="Price (LKR)"
              required
              className="w-32 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            />
            <input
              name="product_url"
              placeholder="Product URL"
              required
              className="flex-1 min-w-[200px] rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <input type="checkbox" name="in_stock" defaultChecked /> In stock
            </label>
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Save price
            </button>
          </form>
        </section>

        {/* Recent prices */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Recently recorded prices
          </h2>
          <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-100 dark:bg-zinc-900 text-left text-zinc-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Product</th>
                  <th className="px-4 py-2 font-medium">Seller</th>
                  <th className="px-4 py-2 font-medium">Price</th>
                  <th className="px-4 py-2 font-medium">Stock</th>
                  <th className="px-4 py-2 font-medium">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
                {prices?.map((p: any) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2 text-zinc-900 dark:text-zinc-100">{p.product?.name}</td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">{p.seller?.name}</td>
                    <td className="px-4 py-2 text-zinc-900 dark:text-zinc-100">{formatLKR(p.price)}</td>
                    <td className="px-4 py-2">
                      {p.in_stock ? (
                        <span className="text-green-600">In stock</span>
                      ) : (
                        <span className="text-red-500">Out</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-zinc-500">{p.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
