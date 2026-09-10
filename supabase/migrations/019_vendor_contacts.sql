-- Vendor PIC list reusing the shared contacts directory (same pattern as
-- customer_contacts). One contact can serve many vendors and customers.
-- Safe to re-run.

create table if not exists public.vendor_contacts (
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

create index if not exists vendor_contacts_vendor_idx on public.vendor_contacts(vendor_id);
create index if not exists vendor_contacts_contact_idx on public.vendor_contacts(contact_id);
create unique index if not exists vendor_contacts_vendor_contact_uniq
  on public.vendor_contacts (vendor_id, contact_id)
  where contact_id is not null;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['vendor_contacts'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists authenticated_full_access on public.%I', table_name);
    execute format('create policy authenticated_full_access on public.%I for all to authenticated using (true) with check (true)', table_name);
  end loop;
end $$;
