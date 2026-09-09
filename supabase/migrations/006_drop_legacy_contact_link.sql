-- Remove the temporary backfill link from migration 003.
-- It creates a second relationship between contacts and customer_contacts,
-- which makes PostgREST embedding ambiguous ("more than one relationship").
-- The orphan duplicates were already removed by migration 005, so this
-- column no longer serves a purpose. Safe to re-run.

alter table public.contacts
  drop column if exists legacy_customer_contact_id;
