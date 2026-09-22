# price.lk

Sri Lankan price comparison site — MVP. Next.js (App Router) + Supabase.

## Setup

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. In the Supabase SQL editor, run `supabase/schema.sql`, then `supabase/seed.sql`.
   The seed inserts 5 real products with prices pulled live from Celltronics.lk,
   SimplyTek.lk and Wasi.lk on 2026-09-22, so you have something to look at immediately.
3. Copy `.env.local.example` to `.env.local` and fill in your project's URL and keys
   (Project Settings → API), plus an `ADMIN_PASSWORD` of your choice.
4. `npm install`
5. `npm run dev` and open http://localhost:3000. Admin dashboard is at `/admin`
   (logs in with `ADMIN_PASSWORD`).

## What's here

- Homepage with search (`src/app/page.tsx`)
- Product detail + price comparison table (`src/app/product/[slug]/page.tsx`)
- Admin dashboard at `/admin` (password-gated via `ADMIN_PASSWORD` cookie) to add
  sellers, add products, and record prices by hand — writes go through the
  Supabase service-role client so RLS stays locked down for everyone else
  (`src/app/admin/`)
- Schema: categories, sellers, products, prices (with `source`/`status` for
  admin-entered vs. user-submitted vs. scraped), price_alerts (`supabase/schema.sql`)

## Live search (scrapers)

Searching the homepage now does two things: queries what's already in the
database, and — in parallel — live-scrapes Celltronics.lk, Wasi.lk and
SimplyTek.lk for the same term (`src/lib/scrapers/`). Results are normalized
and upserted into `products`/`prices` (`src/lib/scrapers/upsert.ts`), so:

- A search someone's never made before still returns real prices, pulled live.
- A repeat search doesn't spam the `prices` table — a new row is only written
  when the price changed or the last check for that product/seller is more
  than 6h old (`STALE_MS` in `upsert.ts`).
- Every scraped listing becomes its own `products` row keyed by its slugified
  title. Different sites phrase the same phone differently (e.g. "Apple
  iPhone 15 128GB" vs. "Apple iPhone 15 – Apple Care Warranty"), so the same
  physical product can currently show up as two separate cards instead of
  one with two sellers. Fixing that needs real product matching (fuzzy title
  match, or a canonical product catalog) — flagged as the top follow-up below.

Adding another retailer: drop a new file in `src/lib/scrapers/` that returns
`ScrapedPrice[]`, add it to `scrapeAllSellers` in `scrapers/index.ts`, and add
the seller to the `sellers` table. Daraz.lk is the obvious next one but is a
JS-rendered SPA, so it needs a different approach (their internal API, or a
headless browser) rather than a plain HTML fetch.

## Not built yet (next steps, roughly in priority order)

1. **Product matching across sellers** — see above; without this, the same
   phone from two sites often shows as two products instead of one row with
   two prices, which undercuts the whole "compare in one place" pitch.
2. **User price submission** flow (product, seller, price, screenshot, link) with
   a verification queue — the `status` column already supports this; needs a
   public form + an admin "pending submissions" review screen.
3. **More retailers** — Daraz.lk, Buyabans.com, and others. See "Live search" above.
4. **Price history + alerts** — the `prices` table already stores every price
   as its own row keyed by `recorded_at`, so a history chart is a group-by
   away; `price_alerts` table + a cron job (Supabase Edge Function) to check
   and email/notify when a target price is hit.
5. Category pages, product images, "price dropped this week" badges, product
   edit/delete in admin (currently add-only).
