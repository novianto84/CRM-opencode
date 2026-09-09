-- Customer profile fields and company logo storage.

alter table public.customers
  add column if not exists npwp text,
  add column if not exists logo_url text;

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

insert into storage.buckets (id, name, public)
values ('company-logos', 'company-logos', true)
on conflict (id) do update set public = true;

drop policy if exists authenticated_company_logos on storage.objects;
create policy authenticated_company_logos on storage.objects
  for all to authenticated
  using (bucket_id = 'company-logos')
  with check (bucket_id = 'company-logos');
