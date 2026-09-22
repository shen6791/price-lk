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
  product_id uuid references products(id) on delete cascade,
  query text,
  email text not null,
  target_price numeric(12,2) not null,
  triggered boolean not null default false,
  created_at timestamptz not null default now(),
  constraint price_alerts_target check (product_id is not null or query is not null)
);

create table if not exists search_queries (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  result_count int not null default 0,
  searched_at timestamptz not null default now()
);

create index if not exists idx_search_queries_query on search_queries (query);
create index if not exists idx_search_queries_searched_at on search_queries (searched_at desc);
alter table search_queries enable row level security;

-- Powers /price-drops — see supabase/migrations/0004_price_drops.sql for notes.
create or replace function recent_price_drops(drop_limit int default 20)
returns table (
  product_name text,
  product_slug text,
  seller_name text,
  old_price numeric,
  new_price numeric,
  drop_percent numeric,
  recorded_at timestamptz
)
language sql
stable
as $$
  with ranked as (
    select
      p.name as product_name,
      p.slug as product_slug,
      s.name as seller_name,
      pr.price,
      pr.recorded_at,
      row_number() over (partition by pr.product_id, pr.seller_id order by pr.recorded_at desc) as rn
    from prices pr
    join products p on p.id = pr.product_id
    join sellers s on s.id = pr.seller_id
  ),
  paired as (
    select
      a.product_name, a.product_slug, a.seller_name,
      b.price as old_price, a.price as new_price, a.recorded_at
    from ranked a
    join ranked b
      on a.product_slug = b.product_slug
     and a.seller_name = b.seller_name
     and a.rn = 1 and b.rn = 2
  )
  select
    product_name, product_slug, seller_name, old_price, new_price,
    round(((old_price - new_price) / old_price) * 100, 1) as drop_percent,
    recorded_at
  from paired
  where new_price < old_price
  order by drop_percent desc
  limit drop_limit;
$$;

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
    (case when p.name ilike '%' || search_query || '%' then 2 else 0 end)
      + greatest(similarity(p.name, search_query), word_similarity(search_query, p.name)) as score
  from products p
  where p.name ilike '%' || search_query || '%'
     or p.name % search_query
     or search_query <% p.name
  order by score desc, length(p.name) asc
  limit match_limit;
$$;
