import Link from "next/link";
import SiteHeader from "../SiteHeader";
import SiteFooter from "../SiteFooter";
import { CATEGORIES } from "@/lib/categories";

export const metadata = { title: "Categories — SmartTech Finder" };

export default function CategoriesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Categories</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Each category runs a broad live search — see the caveat about keyword-based browsing
          in the README.
        </p>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CATEGORIES.map((c) => (
            <Link
              key={c.query}
              href={`/?q=${encodeURIComponent(c.query)}`}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 text-center font-medium text-zinc-900 dark:text-zinc-100 hover:border-blue-500"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
