-- 0004 activity log: who did what, written by triggers so no write can skip it.
-- Append-only: admins can read it, nobody can change or delete it, and there
-- is no insert policy, so only these security definer functions write to it.

create table public.activity_log (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  user_id     uuid references public.profiles (id) on delete set null,
  actor_name  text not null default 'System',
  action      text not null check (action in
                ('created', 'updated', 'deleted', 'voided', 'adjusted', 'payment', 'login', 'logout')),
  module      text not null,
  record_id   text,
  record_label text not null default '',
  summary     text not null,
  changes     jsonb
);

create index activity_log_created_idx on public.activity_log (created_at desc);
create index activity_log_user_idx on public.activity_log (user_id, created_at desc);
create index activity_log_module_idx on public.activity_log (module, created_at desc);

create trigger activity_log_append_only
before update or delete on public.activity_log
for each row execute function public.forbid_change();

create or replace function public.fmt_rs(p numeric)
returns text
language sql immutable
as $$
  select 'Rs ' || case
    when p = trunc(p) then to_char(p, 'FM999,999,999,990')
    else to_char(p, 'FM999,999,999,990.00')
  end
$$;

create or replace function public.fmt_qty(p numeric)
returns text
language sql immutable
as $$
  select rtrim(to_char(p, 'FM999,999,999,990.999'), '.')
$$;

create or replace function public.actor_name()
returns text
language sql stable security definer set search_path = public
as $$
  select coalesce((select full_name from public.profiles where id = auth.uid()), 'System')
$$;

-- Table name -> module shown on the Activity page
create or replace function public.activity_module(p_table text)
returns text
language sql immutable
as $$
  select case p_table
    when 'settings'          then 'settings'
    when 'item_categories'   then 'settings'
    when 'units'             then 'settings'
    when 'brands'            then 'settings'
    when 'sizes'             then 'settings'
    when 'microns'           then 'settings'
    when 'colors'            then 'settings'
    when 'items'             then 'item'
    when 'stock_movements'   then 'stock'
    when 'suppliers'         then 'supplier'
    when 'customers'         then 'customer'
    when 'purchases'         then 'purchase'
    when 'sales'             then 'sale'
    when 'customer_payments' then 'payment'
    when 'supplier_payments' then 'payment'
    when 'recipes'           then 'recipe'
    when 'production_runs'   then 'production'
    when 'profiles'          then 'user'
    else p_table
  end
$$;

-- Human noun for a row, used in the summary sentence
create or replace function public.activity_noun(p_table text)
returns text
language sql immutable
as $$
  select case p_table
    when 'settings'          then 'company settings'
    when 'item_categories'   then 'category'
    when 'units'             then 'unit'
    when 'brands'            then 'brand'
    when 'sizes'             then 'size'
    when 'microns'           then 'micron'
    when 'colors'            then 'color/type'
    when 'items'             then 'item'
    when 'suppliers'         then 'supplier'
    when 'customers'         then 'customer'
    when 'purchases'         then 'purchase'
    when 'sales'             then 'invoice'
    when 'recipes'           then 'recipe'
    when 'production_runs'   then 'production run'
    when 'profiles'          then 'user'
    else replace(p_table, '_', ' ')
  end
$$;

create or replace function public.log_activity()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_old     jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_new     jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  v_row     jsonb := coalesce(v_new, v_old);
  v_action  text;
  v_label   text;
  v_summary text;
  v_changes jsonb;
  v_actor   text := public.actor_name();
  v_noun    text := public.activity_noun(tg_table_name);
  v_party   text;
  v_k       text;
begin
  -- Ledger rows from purchases, sales and production are covered by their
  -- document's own entry; only manual stock entries are logged here.
  if tg_table_name = 'stock_movements' and (v_row->>'type') not in ('opening', 'adjustment') then
    return null;
  end if;

  v_label := coalesce(
    v_row->>'invoice_no', v_row->>'purchase_no', v_row->>'run_no',
    v_row->>'full_name', v_row->>'name', v_row->>'label',
    case when tg_table_name = 'microns' then public.fmt_qty((v_row->>'value')::numeric) end, '');

  if tg_op = 'UPDATE' then
    select jsonb_object_agg(k, jsonb_build_object('from', v_old->k, 'to', v_new->k))
      into v_changes
    from jsonb_object_keys(v_new) k
    where k not in ('updated_at') and (v_old->k) is distinct from (v_new->k);

    if v_changes is null then
      return null;  -- nothing a person would call a change
    end if;
  elsif tg_op = 'INSERT' then
    v_changes := jsonb_build_object('after', v_new);
  else
    v_changes := jsonb_build_object('before', v_old);
  end if;

  v_action := case tg_op when 'INSERT' then 'created' when 'UPDATE' then 'updated' else 'deleted' end;

  if tg_op = 'UPDATE' and (v_new->>'status') = 'void' and (v_old->>'status') = 'posted' then
    v_action := 'voided';
  end if;

  -- Sentences per table, so the log reads like a register
  if tg_table_name = 'stock_movements' then
    select i.name || ' (' || u.short_name || ')' into v_label
    from public.items i join public.units u on u.id = i.unit_id
    where i.id = (v_row->>'item_id')::uuid;
    v_action := 'adjusted';
    v_summary := v_actor || case (v_row->>'type')
      when 'opening' then ' entered opening stock of ' || public.fmt_qty((v_row->>'qty')::numeric) || ' for ' || v_label
      else ' adjusted stock of ' || v_label || ' by ' ||
           case when (v_row->>'qty')::numeric > 0 then '+' else '' end ||
           public.fmt_qty((v_row->>'qty')::numeric) || ' (reason: ' || (v_row->>'note') || ')'
    end;

  elsif tg_table_name in ('customer_payments', 'supplier_payments') then
    if tg_table_name = 'customer_payments' then
      select name into v_party from public.customers where id = (v_row->>'customer_id')::uuid;
    else
      select name into v_party from public.suppliers where id = (v_row->>'supplier_id')::uuid;
    end if;
    v_label := public.fmt_rs((v_row->>'amount')::numeric);
    if tg_op = 'INSERT' then
      v_action := 'payment';
      v_summary := v_actor || case tg_table_name
        when 'customer_payments' then ' recorded a payment of ' || v_label || ' received from ' || v_party
        else ' recorded a payment of ' || v_label || ' made to ' || v_party
      end;
    else
      v_summary := v_actor || ' ' || v_action || ' a payment of ' || v_label ||
        case tg_table_name when 'customer_payments' then ' from ' else ' to ' end || v_party;
    end if;

  elsif tg_table_name = 'sales' then
    select name into v_party from public.customers where id = (v_row->>'customer_id')::uuid;
    v_summary := v_actor || ' ' || v_action || ' invoice ' || v_label || ' for ' || v_party ||
      ' (' || public.fmt_rs((v_row->>'total')::numeric) || ')' ||
      case when v_action = 'voided' then ', reason: ' || (v_row->>'void_reason') else '' end;

  elsif tg_table_name = 'purchases' then
    select name into v_party from public.suppliers where id = (v_row->>'supplier_id')::uuid;
    v_summary := v_actor || ' ' || v_action || ' purchase ' || v_label || ' from ' || v_party ||
      ' (' || public.fmt_rs((v_row->>'total')::numeric) || ')' ||
      case when v_action = 'voided' then ', reason: ' || (v_row->>'void_reason') else '' end;

  elsif tg_table_name = 'production_runs' then
    select name into v_party from public.items where id = (v_row->>'item_id')::uuid;
    v_summary := v_actor || ' ' || v_action || ' production run ' || v_label || ': ' ||
      public.fmt_qty((v_row->>'qty_made')::numeric) || ' x ' || v_party ||
      case when v_action = 'voided' then ', reason: ' || (v_row->>'void_reason') else '' end;

  elsif tg_table_name = 'settings' then
    v_label := 'Company & Invoice';
    select string_agg(k, ', ') into v_k from jsonb_object_keys(coalesce(v_changes, '{}'::jsonb)) k;
    v_summary := v_actor || ' updated company settings' ||
      case when v_k is not null and tg_op = 'UPDATE' then ' (' || replace(v_k, '_', ' ') || ')' else '' end;

  elsif tg_table_name = 'profiles' then
    v_summary := v_actor || ' ' || v_action || ' user ' || v_label ||
      case when tg_op = 'INSERT' then ' as ' || (v_row->>'role') else '' end;

  else
    v_summary := v_actor || ' ' || v_action || ' ' || v_noun || ' ' || v_label;
  end if;

  insert into public.activity_log (user_id, actor_name, action, module, record_id, record_label, summary, changes)
  values (auth.uid(), v_actor, v_action, public.activity_module(tg_table_name),
    coalesce(v_row->>'id', ''), coalesce(v_label, ''), v_summary, v_changes);

  return null;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'settings', 'item_categories', 'units', 'brands', 'sizes', 'microns', 'colors',
    'items', 'stock_movements', 'suppliers', 'customers', 'purchases', 'sales',
    'customer_payments', 'supplier_payments', 'production_runs', 'profiles'
  ] loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I
       for each row execute function public.log_activity()',
      t || '_activity', t);
  end loop;
end $$;

-- Sign in and sign out, called by the app right after the auth call succeeds
create or replace function public.log_event(p_action text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  if p_action not in ('login', 'logout') then
    raise exception 'Unknown event.';
  end if;
  insert into public.activity_log (user_id, actor_name, action, module, record_id, record_label, summary)
  values (auth.uid(), public.actor_name(), p_action, 'session', auth.uid()::text, public.actor_name(),
    public.actor_name() || case p_action when 'login' then ' signed in' else ' signed out' end);
end $$;

-- Recipes are saved as a whole (header plus lines), so save_recipe writes one
-- entry with the full list rather than one per line. Redefined here, now that
-- the log exists, as security definer so it can write to activity_log; it
-- checks the admin role itself before doing anything.
create or replace function public.save_recipe(p_item_id uuid, p_lines jsonb, p_notes text default '')
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_id     uuid;
  v_before jsonb;
  v_after  jsonb;
  v_name   text;
  v_list   text;
  v_new    boolean;
  l        jsonb;
begin
  perform public.require_admin('change a recipe');

  select name into v_name from public.items where id = p_item_id;
  if v_name is null then
    raise exception 'That product no longer exists. Refresh the page and try again.';
  end if;

  select r.id into v_id from public.recipes r where r.item_id = p_item_id;
  v_new := v_id is null;

  select jsonb_agg(jsonb_build_object('material', i.name, 'qty_per_unit', rl.qty_per_unit) order by i.name)
    into v_before
  from public.recipe_lines rl join public.items i on i.id = rl.raw_item_id
  where rl.recipe_id = v_id;

  insert into public.recipes (item_id, notes) values (p_item_id, coalesce(p_notes, ''))
  on conflict (item_id) do update set notes = excluded.notes, updated_at = now()
  returning id into v_id;

  delete from public.recipe_lines where recipe_id = v_id;

  for l in select * from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) loop
    if coalesce((l->>'qty_per_unit')::numeric, 0) <= 0 then
      raise exception 'Every material in the recipe needs a quantity above zero.';
    end if;
    insert into public.recipe_lines (recipe_id, raw_item_id, qty_per_unit)
    values (v_id, (l->>'raw_item_id')::uuid, (l->>'qty_per_unit')::numeric);
  end loop;

  select jsonb_agg(jsonb_build_object('material', i.name, 'qty_per_unit', rl.qty_per_unit) order by i.name),
         string_agg(public.fmt_qty(rl.qty_per_unit) || ' ' || u.short_name || ' ' || i.name, ', ' order by i.name)
    into v_after, v_list
  from public.recipe_lines rl join public.items i on i.id = rl.raw_item_id
  join public.units u on u.id = i.unit_id
  where rl.recipe_id = v_id;

  insert into public.activity_log (user_id, actor_name, action, module, record_id, record_label, summary, changes)
  values (auth.uid(), public.actor_name(), case when v_new then 'created' else 'updated' end, 'recipe',
    v_id::text, v_name,
    public.actor_name() || case when v_new then ' created' else ' updated' end || ' the recipe for ' || v_name ||
      coalesce(' (per unit: ' || v_list || ')', ' (no materials)'),
    jsonb_build_object('before', coalesce(v_before, '[]'::jsonb), 'after', coalesce(v_after, '[]'::jsonb)));

  return v_id;
end $$;
