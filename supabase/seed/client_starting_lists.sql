-- Starting lists for the live database, from the client's voice notes
-- (docs/PLAN.md). Data only, safe to run more than once: every insert
-- skips rows that already exist. No stock, prices, recipes, customers or
-- suppliers; the owner enters those in the app.
--
-- Run in the Supabase SQL Editor of the live project. The activity log
-- records each new row as "System created ...".

-- Common tape microns (the client said each size varies by micron).
insert into public.microns (value)
values (38), (40), (42), (45), (48), (50)
on conflict (value) do nothing;

-- One raw material per type (voice note 1). Low-stock level and rate stay
-- at 0 until the owner sets them.
insert into public.items (kind, category_id, name, code, unit_id)
select 'raw', c.id, v.name, v.code, u.id
from (values
  ('Jumbo Roll (BOPP)', 'JR-BOPP', 'Jumbo Roll',  'Kilogram'),
  ('Paper Tube (core)', 'PT-CORE', 'Paper Tube',  'Pieces'),
  ('Carton Box',        'CB-BOX',  'Carton Box',  'Pieces'),
  ('Shrink Film',       'SF-FILM', 'Shrink Film', 'Kilogram')
) as v (name, code, category, unit)
join public.item_categories c on c.name = v.category
join public.units u on u.name = v.unit
where not exists (select 1 from public.items i where i.code = v.code);

-- A Clear tape carton for each known size (voice note 3). Rolls per carton
-- and micron are left for the owner.
insert into public.items (kind, category_id, name, code, unit_id, size_id, color_id)
select 'finished', c.id, 'Clear Tape ' || s.label,
  'T' || trim(trailing '.' from trim(trailing '0' from s.width_mm::text)) || '-' ||
  trim(trailing '.' from trim(trailing '0' from s.length_yd::text)) || '-C',
  u.id, s.id, k.id
from public.sizes s
join public.item_categories c on c.name = 'Tape Carton'
join public.units u on u.name = 'Carton'
join public.colors k on k.name = 'Clear'
where s.active
  and not exists (
    select 1 from public.items i
    where i.kind = 'finished' and i.size_id = s.id and i.color_id = k.id
  );

-- Check: expect 6 microns, 4 raw materials and 6 products.
select
  (select count(*) from public.microns) as microns,
  (select count(*) from public.items where kind = 'raw') as raw_materials,
  (select count(*) from public.items where kind = 'finished') as products;
