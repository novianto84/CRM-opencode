-- Serial / batch tracking with expiry dates (Accurate-style).
-- Each physical unit or batch of a serialized item gets its own row.
-- Status: available, used, expired.
-- Safe to re-run.

create table if not exists public.serial_numbers (
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

create index if not exists serials_part_idx on public.serial_numbers(spare_part_id, status);
create index if not exists serials_expiry_idx on public.serial_numbers(expiry_date) where expiry_date is not null;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['serial_numbers'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists authenticated_full_access on public.%I', table_name);
    execute format('create policy authenticated_full_access on public.%I for all to authenticated using (true) with check (true)', table_name);
  end loop;
end $$;
