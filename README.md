# price.lk

Sri Lankan price comparison site — MVP. Next.js (App Router) + Supabase.

## Setup

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. In the Supabase SQL editor, run `supabase/schema.sql`. (`supabase/seed.sql`
   is optional — it's only used by the admin-managed catalog, see below; the
   homepage search doesn't need it.)
3. Copy `.env.local.example` to `.env.local` and fill in your project's URL and keys
   (Project Settings → API), plus an `ADMIN_PASSWORD` of your choice.
4. `npm install`
5. `npm run dev` and open http://localhost:3000. Admin dashboard is at `/admin`
   (logs in with `ADMIN_PASSWORD`).

## How search works

The homepage is a pure live lookup: type a product, and the server scrapes
Celltronics.lk, Wasi.lk, SimplyTek.lk and Buyabans.com for it on the spot
(`src/lib/scrapers/`), scores every listing's relevance to the query, and
renders one flat, sortable table — every price from every seller as its own
row, not grouped into per-product cards — with client-side sort (best match
/ price low-high / price high-low) and an in-stock filter
(`src/lib/live-search.ts`, `src/app/ResultsView.tsx`). No database read or
write is involved. Nothing is cached, so the same search two minutes apart
hits the seller sites again and can show a different price.

Relevance scoring (`scoreMatch` in `live-search.ts`) exists because sellers'
own search endpoints are looser than what you'd want here — searching
"apple se 2" on a seller site can surface completely unrelated products
that happen to share a word. A listing needs at least one of the query's
significant words to match (short words like "se" require an exact match,
not just substring containment — "se" is inside "meSsEnger") or it's
dropped entirely; anything that does match stays visible and sorts by
relevance rather than being hidden, which matters most for something like a
discontinued phone model that no tracked seller stocks anymore — you still
see the closest available alternatives instead of an empty page.

Adding another retailer: drop a new file in `src/lib/scrapers/` that returns
`ScrapedPrice[]`, and add it to `scrapeAllSellers` in `scrapers/index.ts`
(and `SELLERS`, and `SELLER_NAMES` in `SearchResults.tsx`). Daraz.lk is the
obvious next one but is a JS-rendered SPA behind Cloudflare, so it needs a
different approach (their internal API, or a headless browser) rather than
a plain HTML fetch.

## Categories

There's no product taxonomy in a database, so "browse by category" is
implemented as chips that link to a pre-filled broad search (e.g. "Phones"
→ `/?q=mobile phone`) reusing the exact same live-search pipeline
(`src/lib/categories.ts`). This works well for narrow, well-chosen terms but
degrades for broad ones — a single ambiguous word like "smartphone" pulls in
accessories that merely mention it (camera gimbals, smart doorbells). Tuned
the category terms to reduce this, but it's inherent to keyword-based
browsing without a real taxonomy; a proper fix needs category metadata per
scraped listing (most sites expose this in their own category URLs/breadcrumbs,
which none of the current scrapers extract yet).

**Known limitation:** each listing is its own row, so the same physical
phone phrased differently by two sites ("Apple iPhone 15 128GB" vs. "Apple
iPhone 15 – Apple Care Warranty") shows as two separate rows rather than
being recognized as the same product. Real product matching (fuzzy title
matching, or a canonical catalog) would fix this but is real work — flagged
below.

## Admin-managed catalog (separate from search)

`/admin` (password-gated via `ADMIN_PASSWORD`) lets you hand-add sellers,
products, and prices into Supabase — this is a separate, persistent catalog
from the live search above, and only reachable by visiting a product's own
page directly; it does not feed into or get fed by the homepage search.
Useful if you want a small set of products with guaranteed-accurate,
manually-verified prices. Schema: categories, sellers, products, prices
(with `source`/`status` for admin-entered vs. user-submitted vs. scraped),
price_alerts (`supabase/schema.sql`). `supabase/migrations/` has a
trigram-based ranked-search Postgres function (`search_products_ranked`)
that was built for this catalog before search moved to the pure live-lookup
model above — not currently called from the app, but there if the admin
catalog ever needs its own ranked search UI.

## Not built yet (next steps, roughly in priority order)

1. **Product matching across sellers** — collapse rows that are the same
   physical product into one, see "Known limitation" above.
2. **More retailers** — Daraz.lk (see above), Kapruka, Softlogic, and others.
   "Every listing in Sri Lanka" isn't something any scraper set can
   literally promise — this only ever covers sites it has a scraper for.
3. **Real categories** — see "Categories" above.
4. Decide what the admin catalog is *for* going forward — right now it's
   disconnected from what visitors actually search, which is confusing positioning.
   Either wire it back into search as a fallback/cache layer, or repurpose it
   (e.g. a curated "editor's picks" section) so it earns its place.
5. "Price dropped this week" badges, price history — these need some form
   of persistence (a cache layer, or the admin catalog wired back in) since
   pure live lookup has nothing to compare against over time.
