-- A pure trigram score let loosely-similar model codes (e.g. "Galaxy A07")
-- occasionally outrank other real substring matches for the query (e.g.
-- "Galaxy A56 256GB Seller Warranty"), because trigram similarity is
-- diluted by name length. A literal substring match is the strongest
-- possible relevance signal, so it now gets a flat score boost that always
-- puts it ahead of fuzzy-only matches; trigram score still orders within
-- each group.

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
