-- Wholesale tiers, per-item tax, and substitutes (Accurate-style).
-- Tier price applies when quotation quantity reaches min_qty.
-- PPN per item flows into the quotation tax total.
-- Safe to re-run.

alter table public.spare_parts
  add column if not exists default_discount_pct numeric(5, 2) not null default 0 check (default_discount_pct >= 0 and default_discount_pct <= 100),
  add column if not exists min_sell_qty numeric(12, 2) not null default 1 check (min_sell_qty >= 0),
  add column if not exists ppn_rate numeric(5, 2) not null default 0 check (ppn_rate >= 0 and ppn_rate <= 100),
  add column if not exists ref_tax_code text;

create table if not exists public.item_price_tiers (
  id uuid primary key default gen_random_uuid(),
  spare_part_id uuid not null references public.spare_parts(id) on delete cascade,
  min_qty numeric(12, 2) not null check (min_qty > 0),
  price numeric(14, 2) not null check (price >= 0),
  created_at timestamptz not null default now(),
  unique (spare_part_id, min_qty)
);

create table if not exists public.item_substitutes (
  id uuid primary key default gen_random_uuid(),
  spare_part_id uuid not null references public.spare_parts(id) on delete cascade,
  substitute_id uuid not null references public.spare_parts(id) on delete restrict,
  notes text,
  created_at timestamptz not null default now(),
  unique (spare_part_id, substitute_id),
  check (spare_part_id <> substitute_id)
);

create index if not exists price_tiers_part_idx on public.item_price_tiers(spare_part_id, min_qty desc);
create index if not exists substitutes_part_idx on public.item_substitutes(spare_part_id);

do $$
declare
  table_name text;
begin
  foreach table_name in array array['item_price_tiers', 'item_substitutes'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists authenticated_full_access on public.%I', table_name);
    execute format('create policy authenticated_full_access on public.%I for all to authenticated using (true) with check (true)', table_name);
  end loop;
end $$;
