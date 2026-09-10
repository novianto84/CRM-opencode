-- Expose pricing and tax columns through the inventory view (appended last).
-- Safe to re-run.

create or replace view public.spare_part_inventory as
select
  sp.id as spare_part_id,
  sp.part_code,
  sp.name,
  sp.unit,
  sp.minimum_stock,
  coalesce(sum(case when im.movement_type = 'inbound' then im.quantity when im.movement_type = 'outbound' then -im.quantity else im.quantity end), 0)::numeric(12, 2) as stock_on_hand,
  count(im.id)::integer as movement_count,
  sp.brand,
  sp.category,
  sp.weight_kg,
  sp.length_cm,
  sp.width_cm,
  sp.height_cm,
  sp.list_price,
  sp.last_purchase_price,
  sp.last_purchase_date,
  sp.photo_url,
  sp.item_type,
  sp.default_discount_pct,
  sp.min_sell_qty,
  sp.ppn_rate,
  sp.ref_tax_code
from public.spare_parts sp
left join public.inventory_movements im on im.spare_part_id = sp.id
group by sp.id;
