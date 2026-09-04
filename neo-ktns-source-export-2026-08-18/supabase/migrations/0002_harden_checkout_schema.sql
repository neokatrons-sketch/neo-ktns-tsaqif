-- Applies after 0001_initial_schema.sql. This migration hardens the empty
-- production schema for the server-side checkout flow without creating a
-- second copy of any business table.

-- The browser supplies one UUID per checkout attempt. The server reuses the
-- same row on retry instead of creating another customer or order.
alter table public.orders
  add column if not exists idempotency_key uuid;

create unique index if not exists orders_idempotency_key_unique
  on public.orders (idempotency_key)
  where idempotency_key is not null;

create unique index if not exists orders_upload_token_hash_unique
  on public.orders (upload_token_hash)
  where upload_token_hash is not null;

-- A per-year counter provides race-safe public order numbers without relying
-- on row counts or MAX(order_number). INSERT ... ON CONFLICT locks one yearly
-- counter row and increments it atomically.
create table if not exists public.order_number_counters (
  order_year integer primary key check (order_year between 2000 and 9999),
  last_value integer not null default 0 check (last_value >= 0),
  updated_at timestamptz not null default now()
);

create or replace function public.next_order_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_year integer := extract(year from current_date)::integer;
  next_value integer;
begin
  insert into public.order_number_counters (order_year, last_value, updated_at)
  values (current_year, 1, now())
  on conflict (order_year) do update
    set last_value = public.order_number_counters.last_value + 1,
        updated_at = now()
  returning last_value into next_value;

  return format('NKT-%s-%s', current_year, lpad(next_value::text, 4, '0'));
end;
$$;

revoke all on function public.next_order_number() from public, anon, authenticated;
grant execute on function public.next_order_number() to service_role;

alter table public.order_number_counters enable row level security;

-- Prevent accidental cross-product combinations when the catalog grows.
alter table public.product_colors
  add constraint product_colors_id_product_id_unique unique (id, product_id);

alter table public.product_sizes
  add constraint product_sizes_id_product_id_unique unique (id, product_id);

alter table public.order_items
  add constraint order_items_color_matches_product
    foreign key (product_color_id, product_id)
    references public.product_colors (id, product_id),
  add constraint order_items_size_matches_product
    foreign key (product_size_id, product_id)
    references public.product_sizes (id, product_id),
  add constraint order_items_line_total_matches_price
    check (line_total = quantity * unit_selling_price);

alter table public.uploaded_design_files
  add constraint uploaded_design_files_design_bucket_only
    check (storage_bucket = 'design-files');

-- Base costs and selling-price overrides must never be exposed to the browser.
drop policy if exists "Public reads active prices" on public.embroidery_price_rules;
