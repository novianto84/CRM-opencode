-- Purchasing: purchase orders and goods receipts (Accurate-style).
-- Receiving goods creates inbound stock and refreshes last purchase price.
-- PO status: draft, sent, partial, received, cancelled.
-- Safe to re-run.

do $$ begin
  create type public.purchase_order_status as enum ('draft', 'sent', 'partial', 'received', 'cancelled');
exception when duplicate_object then null;
end $$;

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_code text not null unique default ('PO-' || to_char(current_date, 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  vendor_id uuid references public.vendors(id) on delete set null,
  vendor_name text,
  status public.purchase_order_status not null default 'draft',
  order_date date not null default current_date,
  expected_date date,
  notes text,
  subtotal numeric(14, 2) not null default 0,
  discount numeric(14, 2) not null default 0,
  tax numeric(14, 2) not null default 0,
  total numeric(14, 2) not null default 0,
  created_by uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  spare_part_id uuid references public.spare_parts(id) on delete set null,
  description text not null,
  quantity numeric(12, 2) not null check (quantity > 0),
  unit text not null default 'pcs',
  unit_price numeric(14, 2) not null default 0 check (unit_price >= 0),
  discount numeric(14, 2) not null default 0 check (discount >= 0),
  line_total numeric(14, 2) generated always as ((quantity * unit_price) - discount) stored,
  received_qty numeric(12, 2) not null default 0 check (received_qty >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.goods_receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_code text not null unique default ('RCV-' || to_char(current_date, 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  purchase_order_id uuid references public.purchase_orders(id) on delete set null,
  warehouse_id uuid not null references public.warehouses(id) on delete restrict,
  received_date date not null default current_date,
  notes text,
  received_by uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.goods_receipt_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.goods_receipts(id) on delete cascade,
  purchase_order_item_id uuid references public.purchase_order_items(id) on delete set null,
  spare_part_id uuid references public.spare_parts(id) on delete restrict,
  quantity numeric(12, 2) not null check (quantity > 0),
  unit_cost numeric(14, 2) not null default 0 check (unit_cost >= 0),
  created_at timestamptz not null default now()
);

create or replace function public.refresh_purchase_order_total()
returns trigger
language plpgsql
as $$
begin
  update public.purchase_orders po
  set subtotal = coalesce((select sum(line_total) from public.purchase_order_items where purchase_order_id = coalesce(new.purchase_order_id, old.purchase_order_id)), 0),
      total = coalesce((select sum(line_total) from public.purchase_order_items where purchase_order_id = coalesce(new.purchase_order_id, old.purchase_order_id)), 0) - po.discount + po.tax,
      updated_at = now()
  where po.id = coalesce(new.purchase_order_id, old.purchase_order_id);
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists purchase_order_items_refresh_total on public.purchase_order_items;
create trigger purchase_order_items_refresh_total
after insert or update or delete on public.purchase_order_items
for each row execute function public.refresh_purchase_order_total();

create index if not exists po_vendor_idx on public.purchase_orders(vendor_id, created_at desc);
create index if not exists po_items_po_idx on public.purchase_order_items(purchase_order_id);
create index if not exists receipt_po_idx on public.goods_receipts(purchase_order_id);
create index if not exists receipt_items_receipt_idx on public.goods_receipt_items(receipt_id);

do $$
declare
  table_name text;
begin
  foreach table_name in array array['purchase_orders', 'purchase_order_items', 'goods_receipts', 'goods_receipt_items'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists authenticated_full_access on public.%I', table_name);
    execute format('create policy authenticated_full_access on public.%I for all to authenticated using (true) with check (true)', table_name);
  end loop;
end $$;
