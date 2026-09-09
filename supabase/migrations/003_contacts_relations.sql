-- Normalize people/PIC data without removing existing customer_contacts data.
-- Run after supabase/schema.sql and the inventory migration.

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  contact_code text not null unique default ('CON-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  full_name text not null,
  position text,
  phone text,
  whatsapp text,
  email text,
  identity_number text,
  birth_date date,
  address text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customer_contacts
  add column if not exists contact_id uuid references public.contacts(id) on delete restrict,
  add column if not exists role text,
  add column if not exists notes text;

alter table public.contacts
  add column if not exists legacy_customer_contact_id uuid unique references public.customer_contacts(id) on delete set null;

insert into public.contacts (full_name, position, phone, email, is_active, legacy_customer_contact_id)
select cc.full_name, cc.position, cc.phone, cc.email, cc.is_active, cc.id
from public.customer_contacts cc
where not exists (
  select 1 from public.contacts c where c.legacy_customer_contact_id = cc.id
);

update public.customer_contacts cc
set contact_id = c.id
from public.contacts c
where c.legacy_customer_contact_id = cc.id
  and cc.contact_id is null;

create index if not exists contacts_email_idx on public.contacts(email);
create index if not exists customer_contacts_contact_idx on public.customer_contacts(contact_id);

alter table public.contacts enable row level security;
drop policy if exists authenticated_full_access on public.contacts;
create policy authenticated_full_access on public.contacts
  for all to authenticated using (true) with check (true);
