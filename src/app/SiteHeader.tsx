import Link from "next/link";

const NAV = [
  { href: "/categories", label: "Categories" },
  { href: "/compare", label: "Compare" },
  { href: "/price-drops", label: "Price Drops" },
  { href: "/price-alerts", label: "Price Alerts" },
  { href: "/stores", label: "Stores" },
  { href: "/ai-finder", label: "AI Tech Finder" },
  { href: "/about", label: "About" },
];

export default function SiteHeader() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4 py-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          SmartTech<span className="text-blue-600">Finder</span>
        </Link>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-blue-600">
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
