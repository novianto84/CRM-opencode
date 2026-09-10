-- Vendors master and stock opname documents (Accurate-style).
-- Transfers use inventory_movements pairs with reference_type
-- 'transfer_out' / 'transfer_in' sharing one reference_id.
-- Opname differences become adjustment movements linked to the order.
-- Safe to re-run.

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default ('VND-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  name text not null unique,
  phone text,
  email text,
  address text,
  npwp text,
  bank_name text,
  bank_account_number text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.spare_part_vendor_prices
  add column if not exists vendor_id uuid references public.vendors(id) on delete set null;

create table if not exists public.stock_opname_orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique default ('SO-' || to_char(current_date, 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  warehouse_id uuid references public.warehouses(id) on delete set null,
  status text not null default 'completed' check (status in ('draft', 'completed', 'cancelled')),
  counted_by uuid references public.employees(id) on delete set null,
  counted_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.stock_opname_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.stock_opname_orders(id) on delete cascade,
  spare_part_id uuid not null references public.spare_parts(id) on delete restrict,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  system_qty numeric(12, 2) not null default 0,
  counted_qty numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

create index if not exists vendors_name_idx on public.vendors(name);
create index if not exists opname_items_order_idx on public.stock_opname_items(order_id);
create index if not exists movements_reference_idx on public.inventory_movements(reference_type, reference_id);

insert into public.vendors (name)
select distinct vendor_name from public.spare_part_vendor_prices where vendor_name is not null and vendor_name <> ''
on conflict (name) do nothing;

update public.spare_part_vendor_prices p
set vendor_id = v.id
from public.vendors v
where v.name = p.vendor_name and p.vendor_id is null;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['vendors', 'stock_opname_orders', 'stock_opname_items'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists authenticated_full_access on public.%I', table_name);
    execute format('create policy authenticated_full_access on public.%I for all to authenticated using (true) with check (true)', table_name);
  end loop;
end $$;
