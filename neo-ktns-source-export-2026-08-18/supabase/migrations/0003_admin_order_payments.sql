-- Prompt 5B: additive payment fields and an atomic, audited order-status
-- transition. This migration is intentionally idempotent and does not alter
-- the customer checkout contract.

alter table public.orders
  add column if not exists payment_amount numeric(14,2) not null default 0,
  add column if not exists payment_confirmed_at timestamptz,
  add column if not exists payment_confirmed_by uuid references auth.users(id) on delete set null,
  add column if not exists payment_note text;

alter table public.orders
  drop constraint if exists orders_payment_amount_nonnegative;

alter table public.orders
  add constraint orders_payment_amount_nonnegative
  check (payment_amount >= 0);

create or replace function public.admin_transition_order_status(
  p_order_id uuid,
  p_to_status text,
  p_note text default null,
  p_changed_by uuid default auth.uid()
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from_status text;
  v_order public.orders;
begin
  if p_changed_by is null
     or not exists (
       select 1
       from public.admin_users
       where user_id = p_changed_by
         and is_active = true
     ) then
    raise exception 'Active administrator required' using errcode = '42501';
  end if;

  if auth.role() <> 'service_role' and p_changed_by <> auth.uid() then
    raise exception 'Administrator identity mismatch' using errcode = '42501';
  end if;

  if p_to_status not in (
    'Draft','Menunggu Konfirmasi Admin','Menunggu Pembayaran',
    'Menunggu Verifikasi Pembayaran','Desain Diperiksa',
    'Menunggu Persetujuan Desain','Masuk Produksi','Quality Control',
    'Siap Diambil','Siap Dikirim','Dalam Pengiriman','Selesai',
    'Ditolak Admin','Dibatalkan Admin'
  ) then
    raise exception 'Unsupported order status' using errcode = '22023';
  end if;

  select status
    into v_from_status
    from public.orders
   where id = p_order_id
   for update;

  if not found then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;

  if v_from_status = p_to_status then
    select * into v_order from public.orders where id = p_order_id;
    return v_order;
  end if;

  update public.orders
     set status = p_to_status,
         updated_at = now()
   where id = p_order_id
   returning * into v_order;

  insert into public.order_status_logs (
    order_id,
    from_status,
    to_status,
    note,
    changed_by
  ) values (
    p_order_id,
    v_from_status,
    p_to_status,
    nullif(left(trim(coalesce(p_note, '')), 1000), ''),
    p_changed_by
  );

  return v_order;
end;
$$;

revoke all on function public.admin_transition_order_status(uuid, text, text, uuid)
  from public, anon;
grant execute on function public.admin_transition_order_status(uuid, text, text, uuid)
  to authenticated, service_role;
