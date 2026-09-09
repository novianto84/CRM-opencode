-- Contact photo and secondary contact fields.
-- Moves legacy whatsapp numbers into phone2 so no data is lost.
-- Safe to re-run.

alter table public.contacts
  add column if not exists phone2 text,
  add column if not exists email2 text,
  add column if not exists photo_url text;

update public.contacts
set phone2 = whatsapp
where phone2 is null and whatsapp is not null;

alter table public.contacts
  drop column if exists whatsapp;

insert into storage.buckets (id, name, public)
values ('contact-photos', 'contact-photos', true)
on conflict (id) do update set public = true;

drop policy if exists authenticated_contact_photos on storage.objects;
create policy authenticated_contact_photos on storage.objects
  for all to authenticated
  using (bucket_id = 'contact-photos')
  with check (bucket_id = 'contact-photos');
