-- Relevance-ranked product search.
-- Plain ILIKE returned matches in arbitrary order, so a search for
-- "iphone 16" mixed phones in with random unrelated accessories that merely
-- contained the word "iPhone" in a compatibility note. This scores every
-- candidate by how closely its name matches the query and returns the
-- best matches first.

create extension if not exists pg_trgm;

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
