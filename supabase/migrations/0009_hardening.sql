-- 0009 hardening.
-- 1. The activity log says what changed on a user: which permission boxes
--    were ticked or unticked, role, sign-in and name.
-- 2. Document numbers cannot be skipped: next_doc_no is no longer callable
--    from the API. Only the posting functions (security definer) take a
--    number, so purchases, invoices and production runs stay gapless.

-- Same words as app/_lib/permissions.js
create or replace function public.permission_label(p_key text)
returns text
language sql immutable
as $$
  select case p_key
    when 'stock_view' then 'See stock'
    when 'purchases'  then 'Record purchases'
    when 'production' then 'Record production'
    when 'sales'      then 'Make invoices'
    when 'sales_cash' then 'Take cash on invoices'
    when 'customers'  then 'Add customers'
    when 'suppliers'  then 'Add suppliers'
    when 'balances'   then 'See balances and payments'
    when 'payments'   then 'Record payments'
    when 'reports'    then 'See reports'
    when 'void'       then 'Cancel entries (void)'
    else p_key
  end
$$;

-- Readable list of what changed on a profile, e.g.
-- "removed Record purchases; added See reports; now Admin".
create or replace function public.profile_change_text(p_old jsonb, p_new jsonb)
returns text
language plpgsql immutable
as $$
declare
  v_parts   text[] := '{}';
  v_added   text;
  v_removed text;
begin
  if (p_old->>'full_name') is distinct from (p_new->>'full_name') then
    v_parts := v_parts || ('renamed from ' || (p_old->>'full_name'));
  end if;
  if (p_old->>'role') is distinct from (p_new->>'role') then
    v_parts := v_parts || (case when p_new->>'role' = 'admin' then 'now Admin' else 'now Worker' end);
  end if;
  if (p_old->>'active') is distinct from (p_new->>'active') then
    v_parts := v_parts || (case when (p_new->>'active')::boolean then 'can sign in again' else 'switched off' end);
  end if;
  if (p_old->'permissions') is distinct from (p_new->'permissions') then
    select string_agg(public.permission_label(k), ', ' order by k) into v_removed
    from jsonb_array_elements_text(coalesce(p_old->'permissions', '[]')) k
    where not coalesce(p_new->'permissions', '[]') ? k;
    select string_agg(public.permission_label(k), ', ' order by k) into v_added
    from jsonb_array_elements_text(coalesce(p_new->'permissions', '[]')) k
    where not coalesce(p_old->'permissions', '[]') ? k;
    if v_removed is not null then v_parts := v_parts || ('removed ' || v_removed); end if;
    if v_added is not null then v_parts := v_parts || ('added ' || v_added); end if;
  end if;
  return array_to_string(v_parts, '; ');
end $$;

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
        case tg_table_name when 'customer_payments' then ' from ' else ' to ' end || v_party ||
        case when v_action = 'voided' and coalesce(v_row->>'void_reason', '') <> '' then ', reason: ' || (v_row->>'void_reason') else '' end;
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
    v_k := case when tg_op = 'UPDATE' then public.profile_change_text(v_old, v_new) end;
    v_summary := v_actor || ' ' || v_action || ' user ' || v_label ||
      case when tg_op = 'INSERT' then ' as ' || (v_row->>'role') else '' end ||
      case when coalesce(v_k, '') <> '' then ': ' || v_k else '' end;

  else
    v_summary := v_actor || ' ' || v_action || ' ' || v_noun || ' ' || v_label;
  end if;

  insert into public.activity_log (user_id, actor_name, action, module, record_id, record_label, summary, changes)
  values (auth.uid(), v_actor, v_action, public.activity_module(tg_table_name),
    coalesce(v_row->>'id', ''), coalesce(v_label, ''), v_summary, v_changes);

  return null;
end $$;


-- ---------------------------------------------------------------
-- Gapless numbers. post_sale is already security definer; purchases and
-- production become so too (same bodies as 0008), then next_doc_no is
-- closed to the API. These functions check the permission, every line and
-- the payment permission themselves; the stock guard trigger still runs.
-- ---------------------------------------------------------------
create or replace function public.post_purchase(p jsonb)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_id    uuid;
  v_no    text;
  v_date  date := coalesce((p->>'purchase_date')::date, current_date);
  v_tot   record;
  l       jsonb;
  v_paid  numeric := coalesce((p->'payment'->>'amount')::numeric, 0);
begin
  perform public.require_perm('purchases', 'record a purchase');
  if (p->>'supplier_id') is null then
    raise exception 'Pick the supplier for this purchase.';
  end if;

  perform public.check_lines(p->'lines', 'raw', 'purchase');
  select * into v_tot from public.doc_totals(
    p->'lines', (p->>'discount')::numeric, (p->>'gst_rate')::numeric, (p->>'other_charges')::numeric);

  if v_paid < 0 then
    raise exception 'The amount paid cannot be negative.';
  end if;
  if v_paid > 0 and not public.has_perm('payments') then
    raise exception 'You do not have permission to record a payment. Save the purchase without the amount paid; an admin adds the payment later.';
  end if;

  v_no := public.next_doc_no('purchase');

  insert into public.purchases (purchase_no, supplier_id, purchase_date, supplier_ref, subtotal,
    discount, gst_rate, gst_amount, other_charges, total, notes)
  values (v_no, (p->>'supplier_id')::uuid, v_date, coalesce(p->>'supplier_ref', ''), v_tot.subtotal,
    coalesce((p->>'discount')::numeric, 0), coalesce((p->>'gst_rate')::numeric, 0), v_tot.gst_amount,
    coalesce((p->>'other_charges')::numeric, 0), v_tot.total, coalesce(p->>'notes', ''))
  returning id into v_id;

  for l in select * from jsonb_array_elements(p->'lines') loop
    insert into public.purchase_lines (purchase_id, item_id, qty, rate)
    values (v_id, (l->>'item_id')::uuid, (l->>'qty')::numeric, (l->>'rate')::numeric);

    insert into public.stock_movements (item_id, movement_date, qty, type, ref_table, ref_id, note)
    values ((l->>'item_id')::uuid, v_date, (l->>'qty')::numeric, 'purchase', 'purchases', v_id, v_no);
  end loop;

  if v_paid > 0 then
    insert into public.supplier_payments (supplier_id, purchase_id, payment_date, amount, method, reference, note)
    values ((p->>'supplier_id')::uuid, v_id, v_date, v_paid,
      coalesce(p->'payment'->>'method', 'cash'), coalesce(p->'payment'->>'reference', ''),
      'Paid with ' || v_no);
  end if;

  return v_id;
end $$;


create or replace function public.post_production(p jsonb)
returns uuid
language plpgsql security definer set search_path = public
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
  perform public.require_perm('production', 'record production');
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



revoke execute on function public.next_doc_no(text) from public, anon, authenticated;

revoke execute on function public.permission_label(text), public.profile_change_text(jsonb, jsonb) from public, anon;
grant execute on function public.permission_label(text), public.profile_change_text(jsonb, jsonb) to authenticated, service_role;
