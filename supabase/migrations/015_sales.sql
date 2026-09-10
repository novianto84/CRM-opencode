-- Sales: orders, deliveries (reduce stock), invoices and payments.
-- Delivery creates outbound movements and updates delivered quantities.
-- Safe to re-run.

do $$ begin
  create type public.sales_order_status as enum ('draft', 'confirmed', 'partial', 'delivered', 'invoiced', 'cancelled');
exception when duplicate_object then null;
end $$;

create table if not exists public.sales_orders (
  id uuid primary key default gen_random_uuid(),
  so_code text not null unique default ('SO-' || to_char(current_date, 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text,
  quotation_id uuid references public.quotations(id) on delete set null,
  status public.sales_order_status not null default 'draft',
  order_date date not null default current_date,
  notes text,
  subtotal numeric(14, 2) not null default 0,
  discount numeric(14, 2) not null default 0,
  tax numeric(14, 2) not null default 0,
  total numeric(14, 2) not null default 0,
  created_by uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_order_items (
  id uuid primary key default gen_random_uuid(),
  sales_order_id uuid not null references public.sales_orders(id) on delete cascade,
  spare_part_id uuid references public.spare_parts(id) on delete set null,
  description text not null,
  quantity numeric(12, 2) not null check (quantity > 0),
  unit text not null default 'pcs',
  unit_price numeric(14, 2) not null default 0 check (unit_price >= 0),
  discount numeric(14, 2) not null default 0 check (discount >= 0),
  line_total numeric(14, 2) generated always as ((quantity * unit_price) - discount) stored,
  delivered_qty numeric(12, 2) not null default 0 check (delivered_qty >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.delivery_orders (
  id uuid primary key default gen_random_uuid(),
  delivery_code text not null unique default ('DO-' || to_char(current_date, 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  sales_order_id uuid references public.sales_orders(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  warehouse_id uuid not null references public.warehouses(id) on delete restrict,
  delivery_date date not null default current_date,
  notes text,
  created_by uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.delivery_items (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.delivery_orders(id) on delete cascade,
  sales_order_item_id uuid references public.sales_order_items(id) on delete set null,
  spare_part_id uuid references public.spare_parts(id) on delete restrict,
  quantity numeric(12, 2) not null check (quantity > 0),
  unit_cost numeric(14, 2) not null default 0 check (unit_cost >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.sales_invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_code text not null unique default ('INV-' || to_char(current_date, 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  sales_order_id uuid references public.sales_orders(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text,
  issue_date date not null default current_date,
  due_date date,
  notes text,
  subtotal numeric(14, 2) not null default 0,
  discount numeric(14, 2) not null default 0,
  tax numeric(14, 2) not null default 0,
  total numeric(14, 2) not null default 0,
  status text not null default 'unpaid' check (status in ('unpaid', 'partial', 'paid', 'cancelled')),
  created_by uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoice_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.sales_invoices(id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  paid_date date not null default current_date,
  method text,
  notes text,
  created_at timestamptz not null default now()
);

create or replace function public.refresh_sales_order_total()
returns trigger
language plpgsql
as $$
begin
  update public.sales_orders so
  set subtotal = coalesce((select sum(line_total) from public.sales_order_items where sales_order_id = coalesce(new.sales_order_id, old.sales_order_id)), 0),
      total = coalesce((select sum(line_total) from public.sales_order_items where sales_order_id = coalesce(new.sales_order_id, old.sales_order_id)), 0) - so.discount + so.tax,
      updated_at = now()
  where so.id = coalesce(new.sales_order_id, old.sales_order_id);
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists sales_order_items_refresh_total on public.sales_order_items;
create trigger sales_order_items_refresh_total
after insert or update or delete on public.sales_order_items
for each row execute function public.refresh_sales_order_total();

create index if not exists so_customer_idx on public.sales_orders(customer_id, created_at desc);
create index if not exists so_items_so_idx on public.sales_order_items(sales_order_id);
create index if not exists delivery_so_idx on public.delivery_orders(sales_order_id);
create index if not exists delivery_items_delivery_idx on public.delivery_items(delivery_id);
create index if not exists invoice_so_idx on public.sales_invoices(sales_order_id);
create index if not exists payments_invoice_idx on public.invoice_payments(invoice_id);

do $$
declare
  table_name text;
begin
  foreach table_name in array array['sales_orders', 'sales_order_items', 'delivery_orders', 'delivery_items', 'sales_invoices', 'invoice_payments'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists authenticated_full_access on public.%I', table_name);
    execute format('create policy authenticated_full_access on public.%I for all to authenticated using (true) with check (true)', table_name);
  end loop;
end $$;
