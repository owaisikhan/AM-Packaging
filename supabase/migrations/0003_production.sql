-- 0003 production: recipes and manufacturing runs.
-- A run adds finished stock and takes the raw materials out in one transaction.

create table public.recipes (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null unique references public.items (id) on delete cascade,
  notes       text not null default '',
  updated_at  timestamptz not null default now()
);

-- qty_per_unit is how much of the raw material one unit of the product uses,
-- for example 1 box, 72 paper tubes and 0.15 kg of shrink film per carton.
create table public.recipe_lines (
  id            uuid primary key default gen_random_uuid(),
  recipe_id     uuid not null references public.recipes (id) on delete cascade,
  raw_item_id   uuid not null references public.items (id),
  qty_per_unit  numeric(14,4) not null check (qty_per_unit > 0),
  unique (recipe_id, raw_item_id)
);

create or replace function public.recipes_check_kinds()
returns trigger
language plpgsql
as $$
declare v_kind text; v_name text;
begin
  if tg_table_name = 'recipes' then
    select kind, name into v_kind, v_name from public.items where id = new.item_id;
    if v_kind <> 'finished' then
      raise exception '"%" is a raw material. Recipes are made for finished products.', v_name;
    end if;
    new.updated_at := now();
  else
    select kind, name into v_kind, v_name from public.items where id = new.raw_item_id;
    if v_kind <> 'raw' then
      raise exception '"%" is a finished product. A recipe can only use raw materials.', v_name;
    end if;
  end if;
  return new;
end $$;

create trigger recipes_check_kinds before insert or update on public.recipes
for each row execute function public.recipes_check_kinds();
create trigger recipe_lines_check_kinds before insert or update on public.recipe_lines
for each row execute function public.recipes_check_kinds();

-- Recipes are saved with public.save_recipe(item_id, lines, notes), defined in
-- 0004 because it also writes the activity log.

create table public.production_runs (
  id          uuid primary key default gen_random_uuid(),
  run_no      text not null unique,
  run_date    date not null default current_date,
  item_id     uuid not null references public.items (id),
  qty_made    numeric(14,3) not null check (qty_made > 0),
  notes       text not null default '',
  status      text not null default 'posted' check (status in ('posted', 'void')),
  void_reason text not null default '',
  created_by  uuid default auth.uid() references public.profiles (id),
  created_at  timestamptz not null default now()
);

-- expected_qty is what the recipe said; qty is what was actually used.
-- The difference is the wastage report.
create table public.production_consumption (
  id            uuid primary key default gen_random_uuid(),
  run_id        uuid not null references public.production_runs (id) on delete cascade,
  raw_item_id   uuid not null references public.items (id),
  qty           numeric(14,3) not null check (qty > 0),
  expected_qty  numeric(14,3)
);

create index production_runs_date_idx on public.production_runs (run_date);
create index production_consumption_run_idx on public.production_consumption (run_id);

-- p = { item_id, run_date, qty_made, notes, materials: [{item_id, qty}] }
create or replace function public.post_production(p jsonb)
returns uuid
language plpgsql
as $$
declare
  v_id     uuid;
  v_no     text;
  v_date   date := coalesce((p->>'run_date')::date, current_date);
  v_made   numeric := (p->>'qty_made')::numeric;
  v_item   uuid := (p->>'item_id')::uuid;
  v_kind   text;
  v_name   text;
  m        jsonb;
  v_exp    numeric;
begin
  if not public.is_staff() then
    raise exception 'Sign in to record production.';
  end if;
  if v_item is null then
    raise exception 'Pick the product that was made.';
  end if;
  if coalesce(v_made, 0) <= 0 then
    raise exception 'Enter how many were made (above zero).';
  end if;

  select kind, name into v_kind, v_name from public.items where id = v_item;
  if v_kind <> 'finished' then
    raise exception '"%" is a raw material. Production records finished products.', v_name;
  end if;

  if (p->'materials') is null or jsonb_array_length(p->'materials') = 0 then
    raise exception 'Add the raw materials used for this run.';
  end if;
  if (select count(*) <> count(distinct x->>'item_id') from jsonb_array_elements(p->'materials') x) then
    raise exception 'The same raw material is listed twice. Combine those rows into one.';
  end if;

  v_no := public.next_doc_no('production');

  insert into public.production_runs (run_no, run_date, item_id, qty_made, notes)
  values (v_no, v_date, v_item, v_made, coalesce(p->>'notes', ''))
  returning id into v_id;

  insert into public.stock_movements (item_id, movement_date, qty, type, ref_table, ref_id, note)
  values (v_item, v_date, v_made, 'production_in', 'production_runs', v_id, v_no);

  for m in select * from jsonb_array_elements(p->'materials') loop
    if coalesce((m->>'qty')::numeric, 0) <= 0 then
      raise exception 'Every material used needs a quantity above zero. Remove rows that were not used.';
    end if;

    select kind, name into v_kind, v_name from public.items where id = (m->>'item_id')::uuid;
    if v_kind <> 'raw' then
      raise exception '"%" is a finished product, so it cannot be used up as a raw material.', v_name;
    end if;

    select rl.qty_per_unit * v_made into v_exp
    from public.recipes r join public.recipe_lines rl on rl.recipe_id = r.id
    where r.item_id = v_item and rl.raw_item_id = (m->>'item_id')::uuid;

    insert into public.production_consumption (run_id, raw_item_id, qty, expected_qty)
    values (v_id, (m->>'item_id')::uuid, (m->>'qty')::numeric, v_exp);

    insert into public.stock_movements (item_id, movement_date, qty, type, ref_table, ref_id, note)
    values ((m->>'item_id')::uuid, v_date, -(m->>'qty')::numeric, 'production_use', 'production_runs', v_id, v_no);
  end loop;

  return v_id;
end $$;

create or replace function public.void_production(p_id uuid, p_reason text)
returns void
language plpgsql
as $$
declare v_row public.production_runs; c record; v_name text; v_unit text; v_left numeric;
begin
  perform public.require_admin('void a production run');
  if length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Write a reason for voiding this production run.';
  end if;
  select * into v_row from public.production_runs where id = p_id for update;
  if v_row.id is null then raise exception 'That production run no longer exists.'; end if;
  if v_row.status = 'void' then raise exception 'Run % is already void.', v_row.run_no; end if;

  select s.name, s.unit, s.on_hand into v_name, v_unit, v_left
  from public.item_stock s where s.id = v_row.item_id;
  if v_left < v_row.qty_made then
    raise exception 'Run % made % % of "%", but only % % are left in stock (the rest have been sold or used). Void those sales first, or correct the stock with an adjustment.',
      v_row.run_no, public.fmt_qty(v_row.qty_made), v_unit, v_name, public.fmt_qty(v_left), v_unit;
  end if;

  -- Return the raw materials first, then take the finished goods back out,
  -- so the stock guard sees the true position.
  for c in select raw_item_id, qty from public.production_consumption where run_id = p_id loop
    insert into public.stock_movements (item_id, qty, type, ref_table, ref_id, note)
    values (c.raw_item_id, c.qty, 'production_use', 'production_runs', p_id, 'Void ' || v_row.run_no);
  end loop;

  insert into public.stock_movements (item_id, qty, type, ref_table, ref_id, note)
  values (v_row.item_id, -v_row.qty_made, 'production_in', 'production_runs', p_id, 'Void ' || v_row.run_no);

  update public.production_runs set status = 'void', void_reason = trim(p_reason) where id = p_id;
end $$;

-- ---------------------------------------------------------------
-- Production list for the screens: product, unit, who entered it, how many
-- materials, and how many of them went over the recipe.
-- ---------------------------------------------------------------
create or replace view public.production_list
with (security_invoker = true)
as
select
  r.id, r.run_no, r.run_date, r.item_id, i.name as item_name, i.code as item_code,
  c.name as category_name, u.short_name as unit, r.qty_made, r.notes, r.status, r.void_reason,
  r.created_by, pr.full_name as created_by_name, r.created_at,
  coalesce(m.materials, 0) as materials,
  coalesce(m.over_recipe, 0) as over_recipe
from public.production_runs r
join public.items i on i.id = r.item_id
join public.item_categories c on c.id = i.category_id
join public.units u on u.id = i.unit_id
left join public.profiles pr on pr.id = r.created_by
left join (
  select run_id, count(*) as materials,
         count(*) filter (where expected_qty is not null and qty > expected_qty) as over_recipe
  from public.production_consumption group by run_id
) m on m.run_id = r.id;

-- Card figures. Quantities are summed per unit (cartons, rolls, bundles),
-- never added across units.
create or replace function public.production_totals(p_from date default null, p_to date default null, p_item uuid default null)
returns jsonb
language sql stable
as $$
  with runs as (
    select * from public.production_list
    where status = 'posted'
      and (p_from is null or run_date >= p_from)
      and (p_to is null or run_date <= p_to)
      and (p_item is null or item_id = p_item)
  )
  select jsonb_build_object(
    'runs', (select count(*) from runs),
    'products', (select count(distinct item_id) from runs),
    'made', coalesce((select jsonb_agg(jsonb_build_object('unit', unit, 'qty', qty) order by qty desc)
                      from (select unit, sum(qty_made) as qty from runs group by unit) t), '[]'::jsonb)
  )
$$;
