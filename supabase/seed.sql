-- Seed data: categories, sellers, and a handful of real products/prices
-- pulled live from Celltronics.lk, SimplyTek.lk and Wasi.lk on 2026-09-22.
-- Replace/extend this over time via the admin flow or scraper.

insert into categories (name, slug, sort_order) values
  ('Phones', 'phones', 1),
  ('Laptops', 'laptops', 2),
  ('Accessories', 'accessories', 3)
on conflict (slug) do nothing;

insert into sellers (name, slug, website) values
  ('Celltronics.lk', 'celltronics', 'https://celltronics.lk'),
  ('SimplyTek', 'simplytek', 'https://www.simplytek.lk'),
  ('Wasi.lk', 'wasi', 'https://www.wasi.lk')
on conflict (slug) do nothing;

with cat as (select id from categories where slug = 'phones'),
     p1 as (
       insert into products (name, slug, brand, category_id)
       select 'Apple iPhone 15 128GB', 'apple-iphone-15-128gb', 'Apple', id from cat
       on conflict (slug) do update set name = excluded.name
       returning id
     ),
     p2 as (
       insert into products (name, slug, brand, category_id)
       select 'Samsung Galaxy A56 5G 8GB/256GB', 'samsung-galaxy-a56-5g-8gb-256gb', 'Samsung', id from cat
       on conflict (slug) do update set name = excluded.name
       returning id
     ),
     p3 as (
       insert into products (name, slug, brand, category_id)
       select 'Samsung Galaxy A06 4GB/64GB', 'samsung-galaxy-a06-4gb-64gb', 'Samsung', id from cat
       on conflict (slug) do update set name = excluded.name
       returning id
     ),
     p4 as (
       insert into products (name, slug, brand, category_id)
       select 'Samsung Galaxy S26 Ultra', 'samsung-galaxy-s26-ultra', 'Samsung', id from cat
       on conflict (slug) do update set name = excluded.name
       returning id
     ),
     p5 as (
       insert into products (name, slug, brand, category_id)
       select 'Samsung Galaxy A16 5G 8GB/128GB', 'samsung-galaxy-a16-5g-8gb-128gb', 'Samsung', id from cat
       on conflict (slug) do update set name = excluded.name
       returning id
     )
select 1;

-- Prices (source = 'scraper' since pulled live from the web, status = 'verified')
insert into prices (product_id, seller_id, price, in_stock, product_url, source, status)
select p.id, s.id, v.price, v.in_stock, v.url, 'scraper', 'verified'
from (values
  ('apple-iphone-15-128gb', 'celltronics', 239900.00, true,  'https://celltronics.lk/product/apple-iphone-15-128gb/'),
  ('apple-iphone-15-128gb', 'wasi',        194207.18, false, 'https://www.wasi.lk/product-category/mobile-phones/smartphones/apple/'),

  ('samsung-galaxy-a56-5g-8gb-256gb', 'celltronics', 134900.00, false, 'https://celltronics.lk/product/samsung-galaxy-a56-8gb-ram-256gb/'),

  ('samsung-galaxy-a06-4gb-64gb', 'celltronics', 29900.00, false, 'https://celltronics.lk/product-category/mobile-phones-price-in-sri-lanka/samsung/a-series/'),
  ('samsung-galaxy-a06-4gb-64gb', 'simplytek',   35499.00, true,  'https://www.simplytek.lk/collections/samsung'),

  ('samsung-galaxy-s26-ultra', 'simplytek', 541099.00, true, 'https://www.simplytek.lk/collections/samsung'),

  ('samsung-galaxy-a16-5g-8gb-128gb', 'celltronics', 69900.00, false, 'https://celltronics.lk/product-category/mobile-phones-price-in-sri-lanka/samsung/a-series/')
) as v(product_slug, seller_slug, price, in_stock, url)
join products p on p.slug = v.product_slug
join sellers s on s.slug = v.seller_slug
on conflict do nothing;
