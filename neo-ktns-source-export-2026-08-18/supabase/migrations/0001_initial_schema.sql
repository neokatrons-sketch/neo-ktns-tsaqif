create extension if not exists pgcrypto;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_id text not null,
  name_en text not null,
  description_id text,
  description_en text,
  material text not null,
  weight_gsm_min integer,
  weight_gsm_max integer,
  production_days_min integer not null default 15,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_colors (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  slug text not null,
  name_id text not null,
  name_en text not null,
  hex_color text not null,
  sort_order integer not null default 0,
  is_available boolean not null default true,
  unique(product_id, slug)
);

create table public.product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  code text not null,
  length_cm numeric(6,2),
  chest_circumference_cm numeric(6,2),
  is_public boolean not null default true,
  is_available boolean not null default true,
  sort_order integer not null default 0,
  unique(product_id, code)
);

create table public.embroidery_packages (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_id text not null,
  name_en text not null,
  description_id text,
  small_point_count integer not null default 0,
  includes_back boolean not null default false,
  allowed_placement_sets jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0
);

create table public.embroidery_price_rules (
  id uuid primary key default gen_random_uuid(),
  embroidery_package_id uuid not null references public.embroidery_packages(id) on delete cascade,
  product_size_id uuid not null references public.product_sizes(id) on delete cascade,
  base_cost integer not null check (base_cost >= 0),
  selling_price_override integer check (selling_price_override is null or selling_price_override >= base_cost),
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique(embroidery_package_id, product_size_id)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  whatsapp text not null,
  address text not null,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid not null references public.customers(id),
  status text not null default 'Draft' check (status in (
    'Draft','Menunggu Konfirmasi Admin','Menunggu Pembayaran','Menunggu Verifikasi Pembayaran',
    'Desain Diperiksa','Menunggu Persetujuan Desain','Masuk Produksi','Quality Control',
    'Siap Diambil','Siap Dikirim','Dalam Pengiriman','Selesai','Ditolak Admin','Dibatalkan Admin'
  )),
  payment_method text not null check (payment_method in ('QRIS','Cash','Konfirmasi Admin')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','dp_pending','dp_verified','paid','rejected')),
  delivery_method text not null check (delivery_method in ('School Pickup','Custom COD','Shipping')),
  subtotal integer not null default 0 check (subtotal >= 0),
  shipping_cost integer check (shipping_cost is null or shipping_cost >= 0),
  discount_amount integer not null default 0 check (discount_amount >= 0),
  temporary_total integer not null default 0 check (temporary_total >= 0),
  final_total integer check (final_total is null or final_total >= 0),
  minimum_dp integer not null default 0 check (minimum_dp >= 0),
  promo_code text,
  canva_url text,
  upload_token_hash text,
  customer_note text,
  admin_note text,
  checked_out_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_color_id uuid not null references public.product_colors(id),
  product_size_id uuid not null references public.product_sizes(id),
  embroidery_package_id uuid not null references public.embroidery_packages(id),
  placement_codes text[] not null default '{}',
  quantity integer not null check (quantity > 0),
  unit_base_cost integer not null check (unit_base_cost >= 0),
  unit_selling_price integer not null check (unit_selling_price >= unit_base_cost),
  unit_profit integer generated always as (unit_selling_price - unit_base_cost) stored,
  line_total integer not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table public.uploaded_design_files (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  original_filename text not null,
  storage_bucket text not null default 'design-files',
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  review_status text not null default 'pending' check (review_status in ('pending','accepted','revision_requested','rejected')),
  uploaded_at timestamptz not null default now()
);

create table public.order_status_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  note text,
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  role text not null default 'admin' check (role in ('owner','admin','operations')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('fixed','percentage')),
  discount_value integer not null check (discount_value > 0),
  minimum_order integer not null default 0,
  maximum_discount integer,
  usage_limit integer,
  usage_count integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.settings (
  key text primary key,
  value jsonb not null,
  description text,
  is_public boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create index orders_status_idx on public.orders(status);
create index orders_created_at_idx on public.orders(created_at desc);
create index order_items_order_id_idx on public.order_items(order_id);
create index design_files_order_id_idx on public.uploaded_design_files(order_id);
create index status_logs_order_id_idx on public.order_status_logs(order_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger price_rules_set_updated_at before update on public.embroidery_price_rules for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders for each row execute function public.set_updated_at();
create trigger settings_set_updated_at before update on public.settings for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.admin_users where user_id = auth.uid() and is_active = true);
$$;

alter table public.products enable row level security;
alter table public.product_colors enable row level security;
alter table public.product_sizes enable row level security;
alter table public.embroidery_packages enable row level security;
alter table public.embroidery_price_rules enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.uploaded_design_files enable row level security;
alter table public.order_status_logs enable row level security;
alter table public.admin_users enable row level security;
alter table public.promo_codes enable row level security;
alter table public.settings enable row level security;

create policy "Public reads active products" on public.products for select using (is_active);
create policy "Public reads colors" on public.product_colors for select using (is_available);
create policy "Public reads sizes" on public.product_sizes for select using (is_available);
create policy "Public reads packages" on public.embroidery_packages for select using (is_active);
create policy "Public reads public settings" on public.settings for select using (is_public);

create policy "Admins manage products" on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage colors" on public.product_colors for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage sizes" on public.product_sizes for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage packages" on public.embroidery_packages for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage prices" on public.embroidery_price_rules for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage customers" on public.customers for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage orders" on public.orders for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage order items" on public.order_items for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage design metadata" on public.uploaded_design_files for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage status logs" on public.order_status_logs for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins read own profiles" on public.admin_users for select using (user_id = auth.uid() or public.is_admin());
create policy "Admins manage promos" on public.promo_codes for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage settings" on public.settings for all using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit)
values ('design-files', 'design-files', false, 10485760)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

create policy "Admins read design files" on storage.objects for select to authenticated
using (bucket_id = 'design-files' and public.is_admin());
create policy "Admins delete design files" on storage.objects for delete to authenticated
using (bucket_id = 'design-files' and public.is_admin());

-- Guest writes use the server-side service role after validating an order-scoped upload token.
-- No anonymous storage insert policy is intentionally created.
