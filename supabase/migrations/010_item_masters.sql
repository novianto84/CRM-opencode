-- Item masters inspired by Accurate: item types, categories, brands,
-- multi-units with conversion, item photos, and bundle composition.
-- Opening stock is recorded as an inbound movement with
-- reference_type = 'opening_balance' (no enum change needed).
-- Safe to re-run.

do $$ begin
  create type public.item_type as enum ('stock', 'non_stock', 'service', 'group');
exception when duplicate_object then null;
end $$;

alter table public.spare_parts
  add column if not exists item_type public.item_type not null default 'stock',
  add column if not exists photo_url text;

create table if not exists public.item_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.item_brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.item_units (
  id uuid primary key default gen_random_uuid(),
  spare_part_id uuid not null references public.spare_parts(id) on delete cascade,
  unit text not null,
  conversion_to_base numeric(14, 4) not null check (conversion_to_base > 0),
  sale_price numeric(14, 2) not null default 0 check (sale_price >= 0),
  created_at timestamptz not null default now(),
  unique (spare_part_id, unit)
);

create table if not exists public.spare_part_bundle_items (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.spare_parts(id) on delete cascade,
  child_id uuid not null references public.spare_parts(id) on delete restrict,
  quantity numeric(12, 2) not null check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (parent_id, child_id),
  check (parent_id <> child_id)
);

create index if not exists item_units_part_idx on public.item_units(spare_part_id);
create index if not exists bundle_parent_idx on public.spare_part_bundle_items(parent_id);

-- Adopt existing distinct values into the new masters.
insert into public.item_categories (name)
select distinct category from public.spare_parts where category is not null and category <> ''
on conflict (name) do nothing;

insert into public.item_brands (name)
select distinct brand from public.spare_parts where brand is not null and brand <> ''
on conflict (name) do nothing;

insert into public.units (code, name)
select distinct unit, unit from public.spare_parts where unit is not null and unit <> ''
on conflict (code) do nothing;

-- Ensure every part has at least its base unit row.
insert into public.item_units (spare_part_id, unit, conversion_to_base, sale_price)
select sp.id, sp.unit, 1, coalesce(sp.list_price, 0)
from public.spare_parts sp
where not exists (
  select 1 from public.item_units iu
  where iu.spare_part_id = sp.id and iu.unit = sp.unit
);

-- Expose photo and item type through the inventory view (appended last).
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
  sp.last_purchase_date,
  sp.photo_url,
  sp.item_type
from public.spare_parts sp
left join public.inventory_movements im on im.spare_part_id = sp.id
group by sp.id;

insert into storage.buckets (id, name, public)
values ('item-photos', 'item-photos', true)
on conflict (id) do update set public = true;

drop policy if exists authenticated_item_photos on storage.objects;
create policy authenticated_item_photos on storage.objects
  for all to authenticated
  using (bucket_id = 'item-photos')
  with check (bucket_id = 'item-photos');

do $$
declare
  table_name text;
begin
  foreach table_name in array array['item_categories', 'item_brands', 'units', 'item_units', 'spare_part_bundle_items'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists authenticated_full_access on public.%I', table_name);
    execute format('create policy authenticated_full_access on public.%I for all to authenticated using (true) with check (true)', table_name);
  end loop;
end $$;
