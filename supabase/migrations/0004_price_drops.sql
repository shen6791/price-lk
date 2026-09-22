-- Powers the /price-drops page: for each product+seller pair with at least
-- two recorded prices, compare the latest to the one before it and surface
-- pairs where the price actually went down.
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
