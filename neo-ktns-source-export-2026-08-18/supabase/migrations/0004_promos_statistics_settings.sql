-- Prompt 5D: additive promo, operational-setting, order-snapshot, and
-- admin-statistics support. This migration is idempotent, preserves all
-- historical rows, and does not add anonymous access to private tables.

alter table public.promo_codes
  add column if not exists display_name text,
  add column if not exists minimum_quantity integer not null default 1,
  add column if not exists archived_at timestamptz,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists updated_by uuid references auth.users(id) on delete set null;

alter table public.promo_codes
  drop constraint if exists promo_codes_minimum_quantity_positive,
  add constraint promo_codes_minimum_quantity_positive check (minimum_quantity >= 1),
  drop constraint if exists promo_codes_percentage_value_valid,
  add constraint promo_codes_percentage_value_valid check (
    discount_type <> 'percentage' or discount_value between 1 and 100
  ),
  drop constraint if exists promo_codes_maximum_discount_nonnegative,
  add constraint promo_codes_maximum_discount_nonnegative check (
    maximum_discount is null or maximum_discount >= 0
  ),
  drop constraint if exists promo_codes_usage_limit_positive,
  add constraint promo_codes_usage_limit_positive check (
    usage_limit is null or usage_limit >= 1
  ),
  drop constraint if exists promo_codes_date_range_valid,
  add constraint promo_codes_date_range_valid check (
    starts_at is null or ends_at is null or starts_at < ends_at
  );

drop trigger if exists promo_codes_set_updated_at on public.promo_codes;
create trigger promo_codes_set_updated_at
before update on public.promo_codes
for each row execute function public.set_updated_at();

alter table public.orders
  add column if not exists promo_code_id uuid references public.promo_codes(id) on delete set null,
  add column if not exists selling_subtotal_before_discount integer,
  add column if not exists selling_subtotal_after_discount integer,
  add column if not exists minimum_dp_percentage_snapshot integer,
  add column if not exists payment_deadline_hours_snapshot integer,
  add column if not exists payment_deadline_at timestamptz,
  add column if not exists production_days_min_snapshot integer;

update public.orders
set
  selling_subtotal_before_discount = coalesce(selling_subtotal_before_discount, subtotal),
  selling_subtotal_after_discount = coalesce(selling_subtotal_after_discount, temporary_total, subtotal),
  minimum_dp_percentage_snapshot = coalesce(minimum_dp_percentage_snapshot, 50),
  payment_deadline_hours_snapshot = coalesce(payment_deadline_hours_snapshot, 24),
  production_days_min_snapshot = coalesce(production_days_min_snapshot, 15)
where checked_out_at is not null;

alter table public.orders
  drop constraint if exists orders_selling_subtotal_before_discount_nonnegative,
  add constraint orders_selling_subtotal_before_discount_nonnegative check (
    selling_subtotal_before_discount is null or selling_subtotal_before_discount >= 0
  ),
  drop constraint if exists orders_selling_subtotal_after_discount_nonnegative,
  add constraint orders_selling_subtotal_after_discount_nonnegative check (
    selling_subtotal_after_discount is null or selling_subtotal_after_discount >= 0
  ),
  drop constraint if exists orders_minimum_dp_percentage_snapshot_valid,
  add constraint orders_minimum_dp_percentage_snapshot_valid check (
    minimum_dp_percentage_snapshot is null or minimum_dp_percentage_snapshot between 0 and 100
  ),
  drop constraint if exists orders_payment_deadline_hours_snapshot_positive,
  add constraint orders_payment_deadline_hours_snapshot_positive check (
    payment_deadline_hours_snapshot is null or payment_deadline_hours_snapshot >= 1
  ),
  drop constraint if exists orders_production_days_min_snapshot_positive,
  add constraint orders_production_days_min_snapshot_positive check (
    production_days_min_snapshot is null or production_days_min_snapshot >= 1
  );

insert into public.settings (key, value, description, is_public)
values
  ('payment_methods', '[{"value":"QRIS","label":"QRIS","enabled":true,"helper":""},{"value":"Cash","label":"Cash","enabled":true,"helper":""},{"value":"Konfirmasi dengan admin","label":"Konfirmasi dengan admin","enabled":true,"helper":""}]'::jsonb, 'Customer-safe payment options', false),
  ('delivery_methods', '[{"value":"Ambil di sekolah","label":"Ambil di sekolah","enabled":true,"helper":"Lokasi dan waktu dikonfirmasi admin."},{"value":"COD / kurir","label":"COD / kurir","enabled":true,"helper":"Biaya dan titik temu dikonfirmasi admin."},{"value":"Pengiriman, ongkir dikonfirmasi admin","label":"Pengiriman","enabled":true,"helper":"Ongkir dikonfirmasi admin."}]'::jsonb, 'Customer-safe delivery options', false),
  ('qris_information', '""'::jsonb, 'Optional public QRIS information; never credentials', false),
  ('preorder_notice', '"Produk menggunakan sistem preorder."'::jsonb, 'Short preorder notice', false),
  ('return_policy_short', '"Produk custom tidak dapat dibatalkan atau dikembalikan kecuali terdapat cacat atau kesalahan produksi."'::jsonb, 'Short custom-product return policy', false),
  ('pickup_notice', '"Lokasi dan waktu pengambilan dikonfirmasi admin."'::jsonb, 'School pickup notice', false)
on conflict (key) do nothing;

-- Locks the draft, validates the promotion against the order's historical
-- item snapshots, increments usage, snapshots business terms, changes status,
-- and writes the first operational log in one transaction.
create or replace function public.finalize_checkout_order(
  p_order_id uuid,
  p_idempotency_key uuid,
  p_promo_code text default null,
  p_minimum_dp_percentage integer default 50,
  p_payment_deadline_hours integer default 24,
  p_production_days_min integer default 15
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_promo public.promo_codes;
  v_subtotal integer;
  v_base_cost bigint;
  v_quantity integer;
  v_discount integer := 0;
  v_after integer;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;

  if p_minimum_dp_percentage not between 0 and 100
     or p_payment_deadline_hours < 1
     or p_production_days_min < 1 then
    raise exception 'Invalid business settings' using errcode = '22023';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id and idempotency_key = p_idempotency_key
  for update;

  if not found then
    raise exception 'Draft order not found' using errcode = 'P0002';
  end if;

  if v_order.status <> 'Draft' then
    return v_order;
  end if;

  select
    coalesce(sum(line_total), 0)::integer,
    coalesce(sum(unit_base_cost::bigint * quantity), 0),
    coalesce(sum(quantity), 0)::integer
  into v_subtotal, v_base_cost, v_quantity
  from public.order_items
  where order_id = p_order_id;

  if v_quantity < 1 then
    raise exception 'Order has no items' using errcode = '22023';
  end if;

  if nullif(upper(trim(coalesce(p_promo_code, ''))), '') is not null then
    select * into v_promo
    from public.promo_codes
    where code = upper(trim(p_promo_code))
      and is_active = true
      and archived_at is null
    for update;

    if not found then
      raise exception 'PROMO_INVALID' using errcode = 'P0001';
    end if;
    if (v_promo.starts_at is not null and now() < v_promo.starts_at)
       or (v_promo.ends_at is not null and now() >= v_promo.ends_at) then
      raise exception 'PROMO_EXPIRED' using errcode = 'P0001';
    end if;
    if v_subtotal < v_promo.minimum_order or v_quantity < v_promo.minimum_quantity then
      raise exception 'PROMO_REQUIREMENT' using errcode = 'P0001';
    end if;
    if v_promo.usage_limit is not null and v_promo.usage_count >= v_promo.usage_limit then
      raise exception 'PROMO_LIMIT' using errcode = 'P0001';
    end if;

    if v_promo.discount_type = 'percentage' then
      v_discount := floor(v_subtotal::numeric * v_promo.discount_value / 100)::integer;
      if v_promo.maximum_discount is not null then
        v_discount := least(v_discount, v_promo.maximum_discount);
      end if;
    else
      v_discount := least(v_promo.discount_value, v_subtotal);
    end if;

    if v_discount <= 0 then
      raise exception 'PROMO_INVALID' using errcode = 'P0001';
    end if;
    if v_subtotal - v_discount < v_base_cost then
      raise exception 'PROMO_BELOW_COST' using errcode = 'P0001';
    end if;
  end if;

  v_after := v_subtotal - v_discount;
  update public.orders
  set
    status = 'Menunggu Konfirmasi Admin',
    subtotal = v_subtotal,
    discount_amount = v_discount,
    temporary_total = v_after,
    minimum_dp = ceil(v_after::numeric * p_minimum_dp_percentage / 100)::integer,
    promo_code = case when v_promo.id is null then null else v_promo.code end,
    promo_code_id = v_promo.id,
    selling_subtotal_before_discount = v_subtotal,
    selling_subtotal_after_discount = v_after,
    minimum_dp_percentage_snapshot = p_minimum_dp_percentage,
    payment_deadline_hours_snapshot = p_payment_deadline_hours,
    payment_deadline_at = now() + make_interval(hours => p_payment_deadline_hours),
    production_days_min_snapshot = p_production_days_min,
    checked_out_at = now(),
    updated_at = now()
  where id = p_order_id
  returning * into v_order;

  if v_promo.id is not null then
    update public.promo_codes
    set usage_count = usage_count + 1
    where id = v_promo.id;
  end if;

  insert into public.order_status_logs (order_id, from_status, to_status, note)
  values (p_order_id, 'Draft', 'Menunggu Konfirmasi Admin',
    case when v_promo.id is null
      then 'Checkout customer berhasil difinalisasi.'
      else 'Checkout customer berhasil difinalisasi dengan promo ' || v_promo.code || '.'
    end);

  return v_order;
end;
$$;

revoke all on function public.finalize_checkout_order(uuid, uuid, text, integer, integer, integer)
from public, anon, authenticated;
grant execute on function public.finalize_checkout_order(uuid, uuid, text, integer, integer, integer)
to service_role;

create index if not exists promo_codes_active_lookup_idx
  on public.promo_codes (code, is_active)
  where archived_at is null;
create index if not exists orders_promo_code_id_idx on public.orders (promo_code_id);
