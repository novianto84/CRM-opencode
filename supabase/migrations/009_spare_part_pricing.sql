-- Spare part pricelist, physical details, and vendor offer history.
-- list_price is the sales/pricelist price used for quotations.
-- last_purchase_price tracks the most recent buying cost.
-- Vendor offers are kept per part so prices can be compared over time.
-- Safe to re-run.

alter table public.spare_parts
  add column if not exists weight_kg numeric(12, 3),
  add column if not exists length_cm numeric(12, 2),
  add column if not exists width_cm numeric(12, 2),
  add column if not exists height_cm numeric(12, 2),
  add column if not exists list_price numeric(14, 2) not null default 0,
  add column if not exists last_purchase_price numeric(14, 2),
  add column if not exists last_purchase_date date;

create table if not exists public.spare_part_vendor_prices (
  id uuid primary key default gen_random_uuid(),
  spare_part_id uuid not null references public.spare_parts(id) on delete cascade,
  vendor_name text not null,
  offered_price numeric(14, 2) not null check (offered_price >= 0),
  valid_until date,
  notes text,
  recorded_by uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists vendor_prices_part_idx
  on public.spare_part_vendor_prices(spare_part_id, created_at desc);

-- Expose pricing and physical details through the inventory view
-- so quotations and the part list can use them in one query.
create or replace view public.spare_part_inventory as
select
  sp.id as spare_part_id,
  sp.part_code,
  sp.name,
  sp.unit,
  sp.minimum_stock,
  coalesce(sum(case when im.movement_type = 'inbound' then im.quantity when im.movement_type = 'outbound' then -im.quantity else im.quantity end), 0)::numeric(12, 2) as stock_on_hand,
  count(im.id)::integer as movement_count,
  sp.brand,
  sp.category,
  sp.weight_kg,
  sp.length_cm,
  sp.width_cm,
  sp.height_cm,
  sp.list_price,
  sp.last_purchase_price,
  sp.last_purchase_date
from public.spare_parts sp
left join public.inventory_movements im on im.spare_part_id = sp.id
group by sp.id;

alter table public.spare_part_vendor_prices enable row level security;
drop policy if exists authenticated_full_access on public.spare_part_vendor_prices;
create policy authenticated_full_access on public.spare_part_vendor_prices
  for all to authenticated using (true) with check (true);
