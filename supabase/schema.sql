-- RuangCRM database schema for Supabase/PostgreSQL.
-- Run this file in Supabase SQL Editor on a new project.

create extension if not exists pgcrypto;

create type public.customer_type as enum ('company', 'person');
create type public.customer_status as enum ('prospect', 'active', 'inactive', 'suspended', 'archived');
create type public.asset_status as enum ('active', 'inactive');
create type public.generator_type as enum ('open_type', 'silent_type');
create type public.operation_system as enum ('single_operation', 'synchrone_operation');
create type public.operation_mode as enum ('standby', 'schedule', 'running_24h');
create type public.maintenance_type as enum ('preventive', 'corrective', 'inspection');
create type public.maintenance_status as enum ('planned', 'in_progress', 'completed', 'cancelled');
create type public.work_order_status as enum ('draft', 'open', 'assigned', 'in_progress', 'waiting_customer', 'completed', 'cancelled');
create type public.item_type as enum ('stock', 'non_stock', 'service', 'group');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.make_customer_code()
returns text
language sql
volatile
as $$
  select 'CST-' || to_char(current_date, 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
$$;

create or replace function public.make_asset_code()
returns text
language sql
volatile
as $$
  select 'AST-' || to_char(current_date, 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
$$;

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  employee_code text not null unique default ('EMP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  full_name text not null,
  email text not null unique,
  phone text,
  phone2 text,
  email2 text,
  npwp text,
  bank_name text,
  bank_account_number text,
  photo_url text,
  position text not null,
  department text not null,
  access_level text not null default 'operator' check (access_level in ('administrator', 'editor', 'operator', 'viewer')),
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  customer_code text not null unique default public.make_customer_code(),
  customer_type public.customer_type,
  name text not null,
  status public.customer_status not null default 'active',
  phone text,
  email text,
  address text,
  notes text,
  npwp text,
  logo_url text,
  created_by uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customer_locations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  location_code text not null unique default ('LOC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  name text not null,
  address text not null,
  contact_name text,
  contact_phone text,
  is_primary boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  contact_code text not null unique default ('CON-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  full_name text not null,
  position text,
  phone text,
  phone2 text,
  email text,
  email2 text,
  photo_url text,
  identity_number text,
  birth_date date,
  address text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customer_contacts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  location_id uuid references public.customer_locations(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete restrict,
  contact_code text not null unique default ('PIC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  full_name text not null,
  position text,
  phone text,
  email text,
  role text,
  notes text,
  is_primary boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  asset_code text not null unique default public.make_asset_code(),
  customer_id uuid not null references public.customers(id) on delete restrict,
  location_id uuid references public.customer_locations(id) on delete set null,
  name text not null,
  generator_serial text not null unique,
  generator_type public.generator_type not null,
  operation_system public.operation_system not null,
  operation_mode public.operation_mode not null default 'standby',
  engine_serial text unique,
  engine_type text,
  alternator_serial text unique,
  alternator_type text,
  capacity_kva numeric(10, 2),
  installation_date date,
  warranty_start_date date,
  warranty_end_date date,
  status public.asset_status not null default 'active',
  last_updated_by uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (warranty_end_date is null or warranty_start_date is null or warranty_end_date >= warranty_start_date)
);

create table public.asset_ownership_history (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  location_id uuid references public.customer_locations(id) on delete set null,
  started_at date not null,
  ended_at date,
  reason text,
  recorded_by uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);

create table public.maintenance_schedules (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  maintenance_type public.maintenance_type not null default 'preventive',
  title text not null,
  interval_hours integer check (interval_hours is null or interval_hours > 0),
  interval_days integer check (interval_days is null or interval_days > 0),
  next_due_date date,
  next_due_hours integer,
  reminder_days_before integer not null default 14 check (reminder_days_before >= 0),
  is_active boolean not null default true,
  created_by uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  work_order_code text not null unique default ('SPK-' || to_char(current_date, 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  customer_id uuid not null references public.customers(id) on delete restrict,
  asset_id uuid references public.assets(id) on delete restrict,
  location_id uuid references public.customer_locations(id) on delete set null,
  assigned_to uuid references public.employees(id) on delete set null,
  title text not null,
  description text,
  status public.work_order_status not null default 'draft',
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  customer_approved_at timestamptz,
  created_by uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.maintenance_records (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  work_order_id uuid references public.work_orders(id) on delete set null,
  schedule_id uuid references public.maintenance_schedules(id) on delete set null,
  maintenance_type public.maintenance_type not null,
  status public.maintenance_status not null default 'completed',
  performed_at timestamptz not null default now(),
  operating_hours integer,
  findings text,
  work_summary text,
  next_due_date date,
  next_due_hours integer,
  performed_by uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.spare_parts (
  id uuid primary key default gen_random_uuid(),
  part_code text not null unique,
  name text not null,
  description text,
  unit text not null default 'pcs',
  stock_quantity numeric(12, 2) not null default 0,
  minimum_stock numeric(12, 2) not null default 0,
  unit_cost numeric(14, 2) not null default 0,
  weight_kg numeric(12, 3),
  length_cm numeric(12, 2),
  width_cm numeric(12, 2),
  height_cm numeric(12, 2),
  list_price numeric(14, 2) not null default 0,
  last_purchase_price numeric(14, 2),
  last_purchase_date date,
  item_type public.item_type not null default 'stock',
  photo_url text,
  default_discount_pct numeric(5, 2) not null default 0 check (default_discount_pct >= 0 and default_discount_pct <= 100),
  min_sell_qty numeric(12, 2) not null default 1 check (min_sell_qty >= 0),
  ppn_rate numeric(5, 2) not null default 0 check (ppn_rate >= 0 and ppn_rate <= 100),
  ref_tax_code text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (stock_quantity >= 0),
  check (minimum_stock >= 0),
  check (unit_cost >= 0)
);

create table public.warehouses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vendors (
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

create table public.spare_part_vendor_prices (
  id uuid primary key default gen_random_uuid(),
  spare_part_id uuid not null references public.spare_parts(id) on delete cascade,
  vendor_id uuid references public.vendors(id) on delete set null,
  vendor_name text not null,
  offered_price numeric(14, 2) not null check (offered_price >= 0),
  valid_until date,
  notes text,
  recorded_by uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.item_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.item_brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.item_units (
  id uuid primary key default gen_random_uuid(),
  spare_part_id uuid not null references public.spare_parts(id) on delete cascade,
  unit text not null,
  conversion_to_base numeric(14, 4) not null check (conversion_to_base > 0),
  sale_price numeric(14, 2) not null default 0 check (sale_price >= 0),
  created_at timestamptz not null default now(),
  unique (spare_part_id, unit)
);

create table public.spare_part_bundle_items (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.spare_parts(id) on delete cascade,
  child_id uuid not null references public.spare_parts(id) on delete restrict,
  quantity numeric(12, 2) not null check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (parent_id, child_id),
  check (parent_id <> child_id)
);

create table public.stock_opname_orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique default ('SO-' || to_char(current_date, 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  warehouse_id uuid references public.warehouses(id) on delete set null,
  status text not null default 'completed' check (status in ('draft', 'completed', 'cancelled')),
  counted_by uuid references public.employees(id) on delete set null,
  counted_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create table public.stock_opname_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.stock_opname_orders(id) on delete cascade,
  spare_part_id uuid not null references public.spare_parts(id) on delete restrict,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  system_qty numeric(12, 2) not null default 0,
  counted_qty numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

create type public.purchase_order_status as enum ('draft', 'sent', 'partial', 'received', 'cancelled');

create table public.purchase_orders (
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

create table public.purchase_order_items (
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

create table public.goods_receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_code text not null unique default ('RCV-' || to_char(current_date, 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  purchase_order_id uuid references public.purchase_orders(id) on delete set null,
  warehouse_id uuid not null references public.warehouses(id) on delete restrict,
  received_date date not null default current_date,
  notes text,
  received_by uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.goods_receipt_items (
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

create type public.sales_order_status as enum ('draft', 'confirmed', 'partial', 'delivered', 'invoiced', 'cancelled');

create table public.sales_orders (
  id uuid primary key default gen_random_uuid(),
  so_code text not null unique default ('SO-' || to_char(current_date, 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text,
  quotation_id uuid,
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

create table public.sales_order_items (
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

create table public.delivery_orders (
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

create table public.delivery_items (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.delivery_orders(id) on delete cascade,
  sales_order_item_id uuid references public.sales_order_items(id) on delete set null,
  spare_part_id uuid references public.spare_parts(id) on delete restrict,
  quantity numeric(12, 2) not null check (quantity > 0),
  unit_cost numeric(14, 2) not null default 0 check (unit_cost >= 0),
  created_at timestamptz not null default now()
);

create table public.sales_invoices (
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

create table public.invoice_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.sales_invoices(id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  paid_date date not null default current_date,
  method text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.vendor_contacts (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete restrict,
  contact_code text not null unique default ('VCP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  full_name text not null,
  position text,
  phone text,
  email text,
  role text,
  notes text,
  is_primary boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.serial_numbers (
  id uuid primary key default gen_random_uuid(),
  spare_part_id uuid not null references public.spare_parts(id) on delete cascade,
  serial_code text not null,
  batch_code text,
  expiry_date date,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  status text not null default 'available' check (status in ('available', 'used', 'expired')),
  reference_type text,
  reference_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  unique (spare_part_id, serial_code)
);

create type public.item_request_status as enum ('draft', 'approved', 'partial', 'fulfilled', 'cancelled');

create table public.item_requests (
  id uuid primary key default gen_random_uuid(),
  request_code text not null unique default ('REQ-' || to_char(current_date, 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  purpose text,
  needed_date date,
  status public.item_request_status not null default 'draft',
  requested_by uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.item_request_items (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.item_requests(id) on delete cascade,
  spare_part_id uuid references public.spare_parts(id) on delete set null,
  description text not null,
  quantity numeric(12, 2) not null check (quantity > 0),
  fulfilled_qty numeric(12, 2) not null default 0 check (fulfilled_qty >= 0),
  created_at timestamptz not null default now()
);

create type public.manufacture_status as enum ('draft', 'in_progress', 'completed', 'cancelled');

create table public.manufacture_orders (
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

create table public.manufacture_materials (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.manufacture_orders(id) on delete cascade,
  spare_part_id uuid references public.spare_parts(id) on delete restrict,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  qty_required numeric(12, 2) not null check (qty_required > 0),
  qty_used numeric(12, 2) not null default 0 check (qty_used >= 0),
  unit_cost numeric(14, 2) not null default 0 check (unit_cost >= 0),
  created_at timestamptz not null default now()
);

create table public.price_adjustments (
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

create table public.item_price_tiers (
  id uuid primary key default gen_random_uuid(),
  spare_part_id uuid not null references public.spare_parts(id) on delete cascade,
  min_qty numeric(12, 2) not null check (min_qty > 0),
  price numeric(14, 2) not null check (price >= 0),
  created_at timestamptz not null default now(),
  unique (spare_part_id, min_qty)
);

create table public.item_substitutes (
  id uuid primary key default gen_random_uuid(),
  spare_part_id uuid not null references public.spare_parts(id) on delete cascade,
  substitute_id uuid not null references public.spare_parts(id) on delete restrict,
  notes text,
  created_at timestamptz not null default now(),
  unique (spare_part_id, substitute_id),
  check (spare_part_id <> substitute_id)
);

create table public.maintenance_parts (
  id uuid primary key default gen_random_uuid(),
  maintenance_record_id uuid not null references public.maintenance_records(id) on delete cascade,
  spare_part_id uuid not null references public.spare_parts(id) on delete restrict,
  quantity numeric(12, 2) not null check (quantity > 0),
  unit_cost numeric(14, 2) not null default 0 check (unit_cost >= 0),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.employees(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null check (action in ('create', 'update', 'delete', 'status_change', 'ownership_change')),
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create or replace view public.employee_public as
select
  id,
  employee_code,
  full_name,
  email,
  position,
  department,
  access_level,
  is_active,
  last_login_at,
  created_at,
  updated_at
from public.employees;

create index customers_status_idx on public.customers(status);
create index customer_locations_customer_idx on public.customer_locations(customer_id);
create index customer_contacts_customer_idx on public.customer_contacts(customer_id);
create index contacts_email_idx on public.contacts(email);
create index customer_contacts_contact_idx on public.customer_contacts(contact_id);
create unique index if not exists customer_contacts_customer_contact_uniq
  on public.customer_contacts (customer_id, contact_id)
  where contact_id is not null;
create index assets_customer_idx on public.assets(customer_id);
create index assets_location_idx on public.assets(location_id);
create index assets_status_idx on public.assets(status);
create index maintenance_schedules_due_idx on public.maintenance_schedules(next_due_date) where is_active = true;
create index maintenance_records_asset_idx on public.maintenance_records(asset_id, performed_at desc);
create index work_orders_customer_idx on public.work_orders(customer_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id, created_at desc);

create or replace view public.customer_summary as
select
  c.id,
  c.customer_code,
  c.customer_type,
  c.name,
  c.status,
  count(distinct a.id)::integer as asset_count,
  count(distinct cc.id)::integer as contact_count,
  min(ms.next_due_date) filter (where ms.is_active and a.status = 'active') as next_maintenance_date,
  c.created_at,
  c.updated_at,
  c.npwp,
  c.logo_url
from public.customers c
left join public.assets a on a.customer_id = c.id
left join public.customer_contacts cc on cc.customer_id = c.id and cc.is_active
left join public.maintenance_schedules ms on ms.asset_id = a.id
group by c.id;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'employees', 'customers', 'customer_locations', 'contacts', 'customer_contacts', 'assets',
    'maintenance_schedules', 'work_orders', 'maintenance_records', 'spare_parts'
  ] loop
    execute format('drop trigger if exists %I_updated_at on public.%I', table_name, table_name);
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end $$;

-- Enable row-level security. The initial policy allows signed-in workspace users
-- to work with the CRM. Tighten these policies when role-specific permissions are wired.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'employees', 'customers', 'customer_locations', 'contacts', 'customer_contacts', 'assets',
    'asset_ownership_history', 'maintenance_schedules', 'work_orders',
    'maintenance_records', 'spare_parts', 'spare_part_vendor_prices', 'item_categories', 'item_brands',
    'units', 'item_units', 'spare_part_bundle_items', 'warehouses', 'vendors', 'stock_opname_orders',
    'stock_opname_items', 'item_price_tiers', 'item_substitutes', 'purchase_orders', 'purchase_order_items',
    'goods_receipts', 'goods_receipt_items', 'sales_orders', 'sales_order_items', 'delivery_orders',
    'delivery_items', 'sales_invoices', 'invoice_payments', 'serial_numbers', 'vendor_contacts', 'item_requests', 'item_request_items',
    'manufacture_orders', 'manufacture_materials', 'price_adjustments', 'maintenance_parts', 'audit_logs'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists authenticated_full_access on public.%I', table_name);
    execute format('create policy authenticated_full_access on public.%I for all to authenticated using (true) with check (true)', table_name);
  end loop;
end $$;
