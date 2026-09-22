# SmartTech Finder Sri Lanka

Find the right tech. Compare the price. Check availability. Find the store.

Not a marketplace — no seller accounts, no store dashboards. SmartTech Finder
discovers publicly available product listings from a set of Sri Lankan
retailer websites, compares them, and links you to the original page to buy.

## Setup

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. In the Supabase SQL editor, run `supabase/schema.sql` (this includes
   everything in `supabase/migrations/` already — the migrations exist as a
   change log for an existing project, `schema.sql` is the up-to-date
   fresh-install version).
3. Copy `.env.local.example` to `.env.local` and fill in your project's URL
   and keys (Project Settings → API), plus an `ADMIN_PASSWORD` of your choice.
4. `npm install`
5. `npm run dev` and open http://localhost:3000. Admin dashboard is at
   `/admin` (logs in with `ADMIN_PASSWORD`).

## What's real vs. what's a stub

This project follows a much larger spec (search-provider abstraction, AI
query understanding, background jobs, admin data-quality automation, user
accounts, notifications, etc.) than one session can actually build. Rather
than fake the whole thing, here's an honest split — check this before
assuming something works:

**Real and working:**
- Live search across 4 sellers (Celltronics.lk, Wasi.lk, SimplyTek,
  Buyabans.com), flattened into one sortable, filterable table
  (`src/lib/live-search.ts`, `src/app/ResultsView.tsx`)
- Relevance scoring so results aren't just an arbitrary seller-search order
- Results persist to Supabase after every search (`prices` table = every
  observation, i.e. real price history), fire-and-forget via Next's
  `after()` so it doesn't slow down the response
  (`src/lib/scrapers/upsert.ts`)
- A short-lived, best-effort in-memory search cache (`src/lib/search-cache.ts`)
- A canonical product page (`/product/[slug]`) with 30-day
  low/avg/high, an SVG price-history sparkline, and per-listing freshness
  labels ("Checked 2 hours ago") built from real stored timestamps
  (`src/lib/freshness.ts`)
- `/price-drops` — a real SQL function (`recent_price_drops` in
  `supabase/schema.sql`) comparing each product/seller's latest two
  observed prices; genuinely empty until the same product gets searched
  more than once
- `/price-alerts` — saves an alert to Supabase (`price_alerts` table)
- `/compare` — runs up to 3 independent live searches and shows each one's
  best match side by side (price/availability/seller only)
- `/ai-finder` — a regex/keyword parser (`src/lib/ai-query.ts`) that pulls
  a budget ("under 200k") and category out of a sentence and runs it
  through the same live search — **not an LLM**, see below
- `/stores` — lists the 4 tracked sources; `/categories` — the same
  keyword-based category chips as before, now with their own page too
- `/admin/search-analytics` and `/admin/data-quality` — real counts from
  Supabase (top searched queries, suspiciously-cheap-price count, stale
  observation count)

**Explicitly stubbed / not built — don't assume these work:**
- **AI query understanding is not an LLM.** `ai-query.ts` is deterministic
  regex/keyword matching. It's a real, working feature, just not
  natural-language AI. Swapping in an actual LLM call is a drop-in
  replacement as long as it returns the same `{ searchTerm, maxPrice,
  category }` shape.
- **Price alert notifications don't send anything.** The form saves the
  alert; there's no cron/background job checking alerts against new prices
  and emailing/pushing a notification. Needs a scheduled job (Vercel Cron →
  a route that runs the check) — not built.
- **User accounts / auth.** No login, no saved products, no saved searches,
  no per-user dashboard. Everything (alerts, comparisons) is anonymous and
  keyed by email at creation time only.
- **Background jobs / queue.** No Redis, no BullMQ, no scheduled re-checks
  of stale listings or broken URLs. The only "background" work is
  `after()`, which just defers DB writes past the response — it's not a
  job queue.
- **Search-provider abstraction.** There's no `SearchProvider` interface or
  a real web-search API (Google/Bing) in the loop — each scraper talks
  directly to one retailer's own search endpoint. See "How search works"
  below for why, and what a real search-layer would need.
- **Product normalization / canonical variant matching.** Each scraped
  listing is its own row; "Apple iPhone 15 128GB" and "Apple iPhone 15 –
  Apple Care Warranty" from two different sites are not recognized as the
  same product. No brand/model/storage/RAM parsing exists.
- **Data-quality automation** beyond the two counters on
  `/admin/data-quality`. No duplicate-product detection, no broken-URL
  checker, no product-mismatch detection — those need a job that actually
  re-visits stored URLs on a schedule.
- **SEO structured data, sitemap.xml.** `robots.txt` exists; JSON-LD
  Product schema and a generated sitemap don't.
- **Location search** ("near me", city picker). Not built — no scraper
  currently extracts a location field, so there's nothing to filter by yet.
- **Monetization, affiliate feeds, sponsored placements.** Not started.

## How search works

Type a product, and the server scrapes Celltronics.lk, Wasi.lk, SimplyTek.lk
and Buyabans.com for it on the spot (`src/lib/scrapers/`), scores every
listing's relevance to the query, and renders one flat, sortable table.
Results also get cached for ~5 minutes (single-instance, best-effort) and
persisted to Supabase so price history, freshness, and price-drops have
real data to work from.

Relevance scoring (`scoreMatch` in `live-search.ts`) exists because sellers'
own search endpoints are looser than what you'd want here. A listing needs
at least one of the query's significant words to match (short words like
"se" require an exact match, not substring containment — "se" is inside
"meSsEnger") or it's dropped; anything that matches stays visible, ranked
by relevance, rather than being hidden — useful when nothing matches
closely (e.g. a discontinued phone model no tracked seller stocks anymore).

**On the "search-provider abstraction" from the fuller spec:** each current
scraper (`src/lib/scrapers/*.ts`) talks directly to one retailer's own
search endpoint (their WooCommerce `?s=`, their Shopify `/search/suggest.json`,
Buyabans' `/search`). This is why coverage tops out at exactly the sites
someone has written a scraper for — there's no general "search the web"
step. A real web-search-provider layer (Google Custom Search API, Bing
Search API, or similar) would let the system discover pages on retailers
nobody's specifically coded for yet, at the cost of much noisier extraction
(you'd need per-domain parsers anyway once you found a page). Worth
building next if "every listing in Sri Lanka" is the actual goal, but it's
a different, larger piece of work than adding one more site-specific
scraper.

Adding another retailer: drop a new file in `src/lib/scrapers/` that returns
`ScrapedPrice[]`, add it to `scrapeAllSellers` in `scrapers/index.ts`, add
the seller to the `sellers` table, and add its display name to
`SELLER_NAMES` in `src/app/ResultsView.tsx`. Daraz.lk is the obvious next
one but is a JS-rendered SPA behind Cloudflare, so it needs a different
approach (their internal API, or a headless browser) rather than a plain
HTML fetch.

**Known limitation:** each listing is its own row — the same physical phone
phrased differently by two sites shows as two rows instead of one merged
product with two sellers. Real product matching (fuzzy title matching, or
extracting brand/model/storage into a canonical structure) would fix this.

## Admin-managed catalog (separate from search)

`/admin` (password-gated via `ADMIN_PASSWORD`) lets you hand-add sellers,
products, and prices — this feeds the same `products`/`prices` tables that
live search now also writes to, so an admin-entered price and a
scraped price for the same product slug will show up together on that
product's `/product/[slug]` page.

## Roadmap, in priority order

1. **Product/variant normalization** — the single biggest thing blocking
   "one row per real product." Needs brand/model/storage/RAM extraction
   and matching, not just a slugified title.
2. **A real LLM for query understanding** — swap `ai-query.ts`'s regex
   parser for an actual model call once you're ready to pay per-request
   API costs; keep the same output shape so nothing downstream changes.
3. **Alert delivery** — a scheduled job (Vercel Cron is the cheapest path
   on this stack) that re-checks each saved alert's query and emails when
   a matching price drops below target.
4. **More retailers**, especially Daraz.lk — biggest coverage lever, hardest
   technically (JS SPA + Cloudflare).
5. **A real search-provider layer** — see "How search works" above.
6. **User accounts** (Supabase Auth is already in the stack via `@supabase/ssr`,
   just not wired to a login flow) — needed before "my saved searches/alerts"
   means anything beyond "whoever has the link."
7. Location search, SEO structured data + sitemap, data-quality automation,
   monetization — see the stub list above for what each needs.
