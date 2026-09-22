-- Price-LK schema

create extension if not exists "pgcrypto";
create extension if not exists pg_trgm;

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order int not null default 0
);

create table if not exists sellers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  website text not null,
  logo_url text,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  brand text,
  category_id uuid references categories(id),
  image_url text,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists prices (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  seller_id uuid not null references sellers(id) on delete cascade,
  price numeric(12,2) not null,
  in_stock boolean not null default true,
  product_url text not null,
  source text not null default 'admin' check (source in ('admin', 'scraper', 'user_submitted')),
  status text not null default 'verified' check (status in ('verified', 'user_submitted', 'needs_verification')),
  submitted_by text,
  screenshot_url text,
  recorded_at timestamptz not null default now(),
  unique (product_id, seller_id, recorded_at)
);

create index if not exists idx_prices_product on prices (product_id, recorded_at desc);
create index if not exists idx_prices_seller on prices (seller_id);

create table if not exists price_alerts (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  email text not null,
  target_price numeric(12,2) not null,
  triggered boolean not null default false,
  created_at timestamptz not null default now()
);

-- Convenience view: latest price per product/seller
create or replace view latest_prices as
select distinct on (product_id, seller_id)
  p.*
from prices p
order by product_id, seller_id, recorded_at desc;

-- RLS: public read, writes restricted to service role
alter table categories enable row level security;
alter table sellers enable row level security;
alter table products enable row level security;
alter table prices enable row level security;
alter table price_alerts enable row level security;

create policy "public read categories" on categories for select using (true);
create policy "public read sellers" on sellers for select using (true);
create policy "public read products" on products for select using (true);
create policy "public read prices" on prices for select using (true);

create policy "anyone can create alert" on price_alerts for insert with check (true);

-- Relevance-ranked search: scores candidates by trigram/word similarity to
-- the query so e.g. "iphone 11" surfaces iPhone 11 listings before loosely
-- related accessories. See migrations/0001_search_ranking.sql for notes.
create index if not exists idx_products_name_trgm on products using gin (name gin_trgm_ops);

create or replace function search_products_ranked(search_query text, match_limit int default 40)
returns table (id uuid, score real)
language sql
stable
as $$
  select p.id,
    greatest(
      similarity(p.name, search_query),
      word_similarity(search_query, p.name)
    ) as score
  from products p
  where p.name ilike '%' || search_query || '%'
     or p.name % search_query
     or search_query <% p.name
  order by score desc, length(p.name) asc
  limit match_limit;
$$;
