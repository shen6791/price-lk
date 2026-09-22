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

## Not built yet (next steps, roughly in priority order)

1. **User price submission** flow (product, seller, price, screenshot, link) with
   a verification queue — the `status` column already supports this; needs a
   public form + an admin "pending submissions" review screen.
2. **Automated scrapers** per retailer. Each retailer has a different HTML
   structure, so this is a scraper-per-site job, not a generic one. Good
   candidates based on today's research: Celltronics.lk, SimplyTek.lk, Wasi.lk,
   Buyabans.com, Daraz.lk. Check each site's robots.txt/ToS before scraping.
3. **Price history + alerts** — the `prices` table already stores every price
   as its own row keyed by `recorded_at`, so a history chart is a group-by
   away; `price_alerts` table + a cron job (Supabase Edge Function) to check
   and email/notify when a target price is hit.
4. Category pages, product images, "price dropped this week" badges, product
   edit/delete in admin (currently add-only).
