-- Sensitive employee profile fields with level-based visibility.
-- Full detail (photo, phones, emails, npwp, bank) is meant for administrators;
-- editors may see contact info; other levels only see the public directory.
-- Safe to re-run.

alter table public.employees
  add column if not exists photo_url text,
  add column if not exists phone2 text,
  add column if not exists email2 text,
  add column if not exists npwp text,
  add column if not exists bank_name text,
  add column if not exists bank_account_number text;

-- Public directory: basic employment info only, no sensitive fields.
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

insert into storage.buckets (id, name, public)
values ('employee-photos', 'employee-photos', true)
on conflict (id) do update set public = true;

drop policy if exists authenticated_employee_photos on storage.objects;
create policy authenticated_employee_photos on storage.objects
  for all to authenticated
  using (bucket_id = 'employee-photos')
  with check (bucket_id = 'employee-photos');
