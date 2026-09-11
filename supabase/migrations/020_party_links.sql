-- Unified business relations: a party can be a customer, a vendor, or both.
-- Links pair one customer row with one vendor row representing the same party.
-- Safe to re-run.

create table if not exists public.party_links (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null unique references public.customers(id) on delete cascade,
  vendor_id uuid not null unique references public.vendors(id) on delete cascade,
  notes text,
  created_at timestamptz not null default now(),
  check (customer_id is not null and vendor_id is not null)
);

create index if not exists party_links_vendor_idx on public.party_links(vendor_id);

do $$
declare
  table_name text;
begin
  foreach table_name in array array['party_links'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists authenticated_full_access on public.%I', table_name);
    execute format('create policy authenticated_full_access on public.%I for all to authenticated using (true) with check (true)', table_name);
  end loop;
end $$;
