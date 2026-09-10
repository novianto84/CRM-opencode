-- Item requests (Permintaan Barang): internal requests for purchase or stock
-- fulfillment. Status: draft, approved, partial, fulfilled, cancelled.
-- Safe to re-run.

do $$ begin
  create type public.item_request_status as enum ('draft', 'approved', 'partial', 'fulfilled', 'cancelled');
exception when duplicate_object then null;
end $$;

create table if not exists public.item_requests (
  id uuid primary key default gen_random_uuid(),
  request_code text not null unique default ('REQ-' || to_char(current_date, 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  purpose text,
  needed_date date,
  status public.item_request_status not null default 'draft',
  requested_by uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.item_request_items (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.item_requests(id) on delete cascade,
  spare_part_id uuid references public.spare_parts(id) on delete set null,
  description text not null,
  quantity numeric(12, 2) not null check (quantity > 0),
  fulfilled_qty numeric(12, 2) not null default 0 check (fulfilled_qty >= 0),
  created_at timestamptz not null default now()
);

create index if not exists request_items_request_idx on public.item_request_items(request_id);

do $$
declare
  table_name text;
begin
  foreach table_name in array array['item_requests', 'item_request_items'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists authenticated_full_access on public.%I', table_name);
    execute format('create policy authenticated_full_access on public.%I for all to authenticated using (true) with check (true)', table_name);
  end loop;
end $$;
