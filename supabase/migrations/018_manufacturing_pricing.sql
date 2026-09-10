-- Manufacturing (Pekerjaan Pesanan) and global price adjustments.
-- Completing a job consumes materials (outbound), produces finished goods
-- (inbound at computed unit cost), and records labor/overhead into HPP.
-- Price adjustments rewrite list prices in bulk and keep an audit doc.
-- Safe to re-run.

do $$ begin
  create type public.manufacture_status as enum ('draft', 'in_progress', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;

create table if not exists public.manufacture_orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique default ('MFG-' || to_char(current_date, 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  finished_part_id uuid references public.spare_parts(id) on delete set null,
  quantity_planned numeric(12, 2) not null check (quantity_planned > 0),
  quantity_produced numeric(12, 2) not null default 0 check (quantity_produced >= 0),
  warehouse_id uuid references public.warehouses(id) on delete set null,
  status public.manufacture_status not null default 'draft',
  labor_cost numeric(14, 2) not null default 0 check (labor_cost >= 0),
  overhead_cost numeric(14, 2) not null default 0 check (overhead_cost >= 0),
  material_cost numeric(14, 2) not null default 0 check (material_cost >= 0),
  started_at date,
  finished_at date,
  notes text,
  created_by uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.manufacture_materials (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.manufacture_orders(id) on delete cascade,
  spare_part_id uuid references public.spare_parts(id) on delete restrict,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  qty_required numeric(12, 2) not null check (qty_required > 0),
  qty_used numeric(12, 2) not null default 0 check (qty_used >= 0),
  unit_cost numeric(14, 2) not null default 0 check (unit_cost >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.price_adjustments (
  id uuid primary key default gen_random_uuid(),
  adjustment_code text not null unique default ('ADJ-' || to_char(current_date, 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  scope_type text not null check (scope_type in ('all', 'category', 'brand')),
  scope_value text,
  percent_change numeric(7, 2) not null,
  affected_count integer not null default 0,
  notes text,
  created_by uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists manufacture_materials_order_idx on public.manufacture_materials(order_id);

do $$
declare
  table_name text;
begin
  foreach table_name in array array['manufacture_orders', 'manufacture_materials', 'price_adjustments'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists authenticated_full_access on public.%I', table_name);
    execute format('create policy authenticated_full_access on public.%I for all to authenticated using (true) with check (true)', table_name);
  end loop;
end $$;
