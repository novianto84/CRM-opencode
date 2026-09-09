-- Spare parts, stock movements, usage history, and quotations.
-- Run after supabase/schema.sql.

do $$ begin
  create type public.inventory_movement_type as enum ('inbound', 'outbound', 'adjustment');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.quotation_status as enum ('draft', 'sent', 'approved', 'rejected', 'expired');
exception when duplicate_object then null;
end $$;

alter table public.spare_parts
  add column if not exists brand text,
  add column if not exists category text,
  add column if not exists specification text,
  add column if not exists compatible_models text,
  add column if not exists supplier_name text,
  add column if not exists barcode text unique,
  add column if not exists is_serialized boolean not null default false;

create table if not exists public.warehouses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  spare_part_id uuid not null references public.spare_parts(id) on delete restrict,
  warehouse_id uuid not null references public.warehouses(id) on delete restrict,
  movement_type public.inventory_movement_type not null,
  quantity numeric(12, 2) not null check (quantity > 0),
  unit_cost numeric(14, 2) not null default 0 check (unit_cost >= 0),
  reference_type text,
  reference_id uuid,
  notes text,
  recorded_by uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.maintenance_parts
  add column if not exists warehouse_id uuid references public.warehouses(id) on delete restrict,
  add column if not exists inventory_movement_id uuid references public.inventory_movements(id) on delete set null;

create or replace function public.record_maintenance_part_usage()
returns trigger
language plpgsql
as $$
declare
  movement_id uuid;
begin
  if new.warehouse_id is null or new.inventory_movement_id is not null then
    return new;
  end if;
  insert into public.inventory_movements (spare_part_id, warehouse_id, movement_type, quantity, unit_cost, reference_type, reference_id)
  select new.spare_part_id, new.warehouse_id, 'outbound', new.quantity, new.unit_cost, 'maintenance', new.maintenance_record_id
  returning id into movement_id;
  update public.maintenance_parts set inventory_movement_id = movement_id where id = new.id;
  return new;
end;
$$;

drop trigger if exists maintenance_parts_record_usage on public.maintenance_parts;
create trigger maintenance_parts_record_usage
after insert on public.maintenance_parts
for each row execute function public.record_maintenance_part_usage();

create or replace view public.spare_part_inventory as
select
  sp.id as spare_part_id,
  sp.part_code,
  sp.name,
  sp.unit,
  sp.minimum_stock,
  coalesce(sum(case when im.movement_type = 'inbound' then im.quantity when im.movement_type = 'outbound' then -im.quantity else im.quantity end), 0)::numeric(12, 2) as stock_on_hand,
  count(im.id)::integer as movement_count
from public.spare_parts sp
left join public.inventory_movements im on im.spare_part_id = sp.id
group by sp.id;

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  quotation_code text not null unique default ('QUO-' || to_char(current_date, 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  customer_id uuid not null references public.customers(id) on delete restrict,
  work_order_id uuid references public.work_orders(id) on delete set null,
  status public.quotation_status not null default 'draft',
  valid_until date,
  notes text,
  subtotal numeric(14, 2) not null default 0,
  discount numeric(14, 2) not null default 0,
  tax numeric(14, 2) not null default 0,
  total numeric(14, 2) not null default 0,
  created_by uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations(id) on delete cascade,
  spare_part_id uuid references public.spare_parts(id) on delete set null,
  description text not null,
  quantity numeric(12, 2) not null check (quantity > 0),
  unit text not null default 'pcs',
  unit_price numeric(14, 2) not null default 0 check (unit_price >= 0),
  discount numeric(14, 2) not null default 0 check (discount >= 0),
  line_total numeric(14, 2) generated always as ((quantity * unit_price) - discount) stored,
  created_at timestamptz not null default now()
);

create or replace function public.refresh_quotation_total()
returns trigger
language plpgsql
as $$
begin
  update public.quotations q
  set subtotal = coalesce((select sum(line_total) from public.quotation_items where quotation_id = coalesce(new.quotation_id, old.quotation_id)), 0),
      total = coalesce((select sum(line_total) from public.quotation_items where quotation_id = coalesce(new.quotation_id, old.quotation_id)), 0) - q.discount + q.tax,
      updated_at = now()
  where q.id = coalesce(new.quotation_id, old.quotation_id);
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists quotation_items_refresh_total on public.quotation_items;
create trigger quotation_items_refresh_total
for each row execute function public.refresh_quotation_total();

create index inventory_movements_part_idx on public.inventory_movements(spare_part_id, created_at desc);
create index inventory_movements_warehouse_idx on public.inventory_movements(warehouse_id, created_at desc);
create index quotations_customer_idx on public.quotations(customer_id, created_at desc);
create index quotation_items_quotation_idx on public.quotation_items(quotation_id);

do $$
declare
  table_name text;
begin
  foreach table_name in array array['warehouses', 'quotations'] loop
    execute format('drop trigger if exists %I_updated_at on public.%I', table_name, table_name);
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end $$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['warehouses', 'inventory_movements', 'quotations', 'quotation_items'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists authenticated_full_access on public.%I', table_name);
    execute format('create policy authenticated_full_access on public.%I for all to authenticated using (true) with check (true)', table_name, table_name);
  end loop;
end $$;
