-- SmartTech Finder rebrand: price alerts need to work against a live search
-- term, not just a pre-existing canonical product row, since most listings
-- are discovered live and never get a stable product_id. Also add search
-- analytics (spec section 39/43) so /admin/search-analytics has real data.

alter table price_alerts
  alter column product_id drop not null,
  add column if not exists query text,
  add constraint price_alerts_target check (product_id is not null or query is not null);

create table if not exists search_queries (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  result_count int not null default 0,
  searched_at timestamptz not null default now()
);

create index if not exists idx_search_queries_query on search_queries (query);
create index if not exists idx_search_queries_searched_at on search_queries (searched_at desc);

alter table search_queries enable row level security;
-- No public policy: only the service-role client (server-side) writes/reads this.
