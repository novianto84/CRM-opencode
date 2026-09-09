-- Remove duplicate contacts created by migration 003 backfill.
-- Keeps every contact that is actually referenced by customer_contacts.
-- Safe to re-run.

delete from public.contacts c
where c.legacy_customer_contact_id is not null
  and not exists (
    select 1 from public.customer_contacts cc
    where cc.contact_id = c.id
  );

-- Prevent linking the same contact to the same customer twice.
create unique index if not exists customer_contacts_customer_contact_uniq
  on public.customer_contacts (customer_id, contact_id)
  where contact_id is not null;
