-- 0006 starting data: the company, the categories and sizes from the client's
-- voice notes, and common units. Everything here is editable in Settings.

insert into public.settings (id) values (1) on conflict (id) do nothing;

insert into public.item_categories (name, kind, sort_order) values
  ('Jumbo Roll',    'raw',      1),
  ('Paper Tube',    'raw',      2),
  ('Carton Box',    'raw',      3),
  ('Shrink Film',   'raw',      4),
  ('Tape Carton',   'finished', 1),
  ('Stretch Film',  'finished', 2),
  ('Plastic Strip', 'finished', 3)
on conflict (name) do nothing;

insert into public.units (name, short_name) values
  ('Pieces',     'pcs'),
  ('Kilogram',   'kg'),
  ('Roll',       'roll'),
  ('Carton',     'ctn'),
  ('Meter',      'm'),
  ('Bundle',     'bdl')
on conflict (name) do nothing;

-- The six sizes named in the voice notes. The client adds the rest.
insert into public.sizes (width_mm, length_yd) values
  (24, 72), (46, 72), (46, 70), (60, 72), (69, 72), (72, 72)
on conflict (width_mm, length_yd) do nothing;

insert into public.colors (name) values
  ('Clear'), ('Brown'), ('Printed'), ('Colored'), ('Kraft')
on conflict (name) do nothing;
