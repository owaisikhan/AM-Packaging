-- 0008 per-worker permissions. The owner ticks, for each worker, what they
-- may do. Admins can always do everything. Settings, items and recipes, stock
-- adjustments, users and the activity log stay admin-only.
--
-- Keys (each worker's profiles.permissions):
--   stock_view   see stock, raw materials and products
--   purchases    record purchases
--   production   record production
--   sales        make invoices
--   sales_cash   take cash on a new invoice
--   customers    add customers
--   suppliers    add suppliers
--   balances     see balances, payments and ledgers
--   payments     record payments (customer and supplier, and on a new purchase)
--   reports      see reports and the dashboard money figures
--   void         cancel (void) purchases, invoices, production runs and payments
--
-- Existing workers get the first seven, which is exactly what a worker could
-- do before this migration, so nothing changes until an admin edits them.

alter table public.profiles
  add column permissions text[] not null
    default '{stock_view,purchases,production,sales,sales_cash,customers,suppliers}';

alter table public.profiles
  add constraint profiles_permissions_known check (permissions <@ array[
    'stock_view', 'purchases', 'production', 'sales', 'sales_cash', 'customers', 'suppliers',
    'balances', 'payments', 'reports', 'void'
  ]::text[]);

-- True for an admin, or for an active staff member who has been given p.
-- security definer so the policy on profiles does not recurse.
create or replace function public.has_perm(p text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select role = 'admin' or p = any(permissions)
     from public.profiles where id = auth.uid() and active),
    false)
$$;

create or replace function public.require_perm(p text, p_what text)
returns void
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.has_perm(p) then
    if public.is_staff() then
      raise exception 'You do not have permission to %. Ask an admin to give you this permission in Users.', p_what;
    end if;
    raise exception 'Sign in to %.', p_what;
  end if;
end $$;

-- ---------------------------------------------------------------
-- Posting: same as before, with the permission checks.
-- ---------------------------------------------------------------
create or replace function public.post_purchase(p jsonb)
returns uuid
language plpgsql
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

create or replace function public.post_sale(p jsonb)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_id    uuid;
  v_no    text;
  v_date  date := coalesce((p->>'sale_date')::date, current_date);
  v_tot   record;
  l       jsonb;
  v_paid  numeric := coalesce((p->'payment'->>'amount')::numeric, 0);
begin
  perform public.require_perm('sales', 'make an invoice');
  if (p->>'customer_id') is null then
    raise exception 'Pick the customer for this sale.';
  end if;

  perform public.check_lines(p->'lines', 'finished', 'sale');
  select * into v_tot from public.doc_totals(
    p->'lines', (p->>'discount')::numeric, (p->>'gst_rate')::numeric, (p->>'other_charges')::numeric);

  if v_paid < 0 then
    raise exception 'The amount received cannot be negative.';
  end if;
  if v_paid > 0 and not (public.has_perm('sales_cash') or public.has_perm('payments')) then
    raise exception 'You do not have permission to take cash on an invoice. Save the invoice with 0 received; an admin adds the payment later.';
  end if;

  v_no := public.next_doc_no('invoice');

  insert into public.sales (invoice_no, customer_id, sale_date, due_date, subtotal, discount,
    gst_rate, gst_amount, other_charges, total, notes)
  values (v_no, (p->>'customer_id')::uuid, v_date, (p->>'due_date')::date, v_tot.subtotal,
    coalesce((p->>'discount')::numeric, 0), coalesce((p->>'gst_rate')::numeric, 0), v_tot.gst_amount,
    coalesce((p->>'other_charges')::numeric, 0), v_tot.total, coalesce(p->>'notes', ''))
  returning id into v_id;

  for l in select * from jsonb_array_elements(p->'lines') loop
    insert into public.sale_lines (sale_id, item_id, qty, rate)
    values (v_id, (l->>'item_id')::uuid, (l->>'qty')::numeric, (l->>'rate')::numeric);

    insert into public.stock_movements (item_id, movement_date, qty, type, ref_table, ref_id, note)
    values ((l->>'item_id')::uuid, v_date, -(l->>'qty')::numeric, 'sale', 'sales', v_id, v_no);
  end loop;

  if v_paid > 0 then
    insert into public.customer_payments (customer_id, sale_id, payment_date, amount, method, reference, note)
    values ((p->>'customer_id')::uuid, v_id, v_date, v_paid,
      coalesce(p->'payment'->>'method', 'cash'), coalesce(p->'payment'->>'reference', ''),
      'Received with ' || v_no);
  end if;

  return v_id;
end $$;

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


-- ---------------------------------------------------------------
-- Voiding: needs the void permission. security definer, so a permitted
-- worker can cancel only through these functions; the tables' update
-- policies stay admin-only and amounts can never be edited directly.
-- ---------------------------------------------------------------
create or replace function public.void_purchase(p_id uuid, p_reason text)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_row public.purchases; l record;
begin
  perform public.require_perm('void', 'void a purchase');
  if length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Write a reason for voiding this purchase.';
  end if;
  select * into v_row from public.purchases where id = p_id for update;
  if v_row.id is null then raise exception 'That purchase no longer exists.'; end if;
  if v_row.status = 'void' then raise exception 'Purchase % is already void.', v_row.purchase_no; end if;

  for l in select item_id, qty from public.purchase_lines where purchase_id = p_id loop
    insert into public.stock_movements (item_id, qty, type, ref_table, ref_id, note)
    values (l.item_id, -l.qty, 'purchase', 'purchases', p_id, 'Void ' || v_row.purchase_no);
  end loop;

  update public.supplier_payments set status = 'void', void_reason = 'Purchase ' || v_row.purchase_no || ' voided'
  where purchase_id = p_id and status = 'posted';
  update public.purchases set status = 'void', void_reason = trim(p_reason) where id = p_id;
end $$;


create or replace function public.void_sale(p_id uuid, p_reason text)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_row public.sales; l record;
begin
  perform public.require_perm('void', 'void a sale');
  if length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Write a reason for voiding this invoice.';
  end if;
  select * into v_row from public.sales where id = p_id for update;
  if v_row.id is null then raise exception 'That invoice no longer exists.'; end if;
  if v_row.status = 'void' then raise exception 'Invoice % is already void.', v_row.invoice_no; end if;

  for l in select item_id, qty from public.sale_lines where sale_id = p_id loop
    insert into public.stock_movements (item_id, qty, type, ref_table, ref_id, note)
    values (l.item_id, l.qty, 'sale', 'sales', p_id, 'Void ' || v_row.invoice_no);
  end loop;

  update public.customer_payments set status = 'void', void_reason = 'Invoice ' || v_row.invoice_no || ' voided'
  where sale_id = p_id and status = 'posted';
  update public.sales set status = 'void', void_reason = trim(p_reason) where id = p_id;
end $$;


create or replace function public.void_production(p_id uuid, p_reason text)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_row public.production_runs; c record; v_name text; v_unit text; v_left numeric;
begin
  perform public.require_perm('void', 'void a production run');
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


create or replace function public.void_supplier_payment(p_id uuid, p_reason text)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_row public.supplier_payments;
begin
  perform public.require_perm('void', 'void a payment');
  if length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Write a reason for voiding this payment.';
  end if;
  select * into v_row from public.supplier_payments where id = p_id for update;
  if v_row.id is null then raise exception 'That payment no longer exists.'; end if;
  if v_row.status = 'void' then raise exception 'This payment is already void.'; end if;
  update public.supplier_payments set status = 'void', void_reason = trim(p_reason) where id = p_id;
end $$;


create or replace function public.void_customer_payment(p_id uuid, p_reason text)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_row public.customer_payments;
begin
  perform public.require_perm('void', 'void a payment');
  if length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Write a reason for voiding this payment.';
  end if;
  select * into v_row from public.customer_payments where id = p_id for update;
  if v_row.id is null then raise exception 'That payment no longer exists.'; end if;
  if v_row.status = 'void' then raise exception 'This payment is already void.'; end if;
  update public.customer_payments set status = 'void', void_reason = trim(p_reason) where id = p_id;
end $$;


-- ---------------------------------------------------------------
-- Recording payments: needs the payments permission. security definer so
-- the over-payment checks see every earlier payment, whatever the caller
-- may read.
-- ---------------------------------------------------------------
create or replace function public.record_supplier_payment(p jsonb)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_id       uuid;
  v_supplier uuid := (p->>'supplier_id')::uuid;
  v_purchase uuid := nullif(p->>'purchase_id', '')::uuid;
  v_amount   numeric := (p->>'amount')::numeric;
  v_row      public.purchases;
  v_name     text;
begin
  perform public.require_perm('payments', 'record a payment to a supplier');
  select name into v_name from public.suppliers where id = v_supplier;
  if v_name is null then
    raise exception 'Pick the supplier this payment was made to.';
  end if;
  if coalesce(v_amount, 0) <= 0 then
    raise exception 'Enter the amount paid, above zero.';
  end if;

  if v_purchase is not null then
    select * into v_row from public.purchases where id = v_purchase;
    if v_row.id is null then
      raise exception 'That purchase no longer exists. Refresh the page and try again.';
    end if;
    if v_row.supplier_id <> v_supplier then
      raise exception 'Purchase % is from a different supplier, not %. Pick a bill from % or leave the bill empty.',
        v_row.purchase_no, v_name, v_name;
    end if;
    if v_row.status = 'void' then
      raise exception 'Purchase % is void, so a payment cannot be linked to it.', v_row.purchase_no;
    end if;
  end if;

  insert into public.supplier_payments (supplier_id, purchase_id, payment_date, amount, method, reference, note)
  values (v_supplier, v_purchase, coalesce((p->>'payment_date')::date, current_date), v_amount,
    coalesce(nullif(p->>'method', ''), 'cash'), coalesce(p->>'reference', ''), coalesce(p->>'note', ''))
  returning id into v_id;
  return v_id;
end $$;


create or replace function public.record_customer_payment(p jsonb)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_id       uuid;
  v_customer uuid := (p->>'customer_id')::uuid;
  v_sale     uuid := nullif(p->>'sale_id', '')::uuid;
  v_amount   numeric := (p->>'amount')::numeric;
  v_row      public.sales;
  v_name     text;
begin
  perform public.require_perm('payments', 'record a payment from a customer');
  select name into v_name from public.customers where id = v_customer;
  if v_name is null then
    raise exception 'Pick the customer this payment came from.';
  end if;
  if coalesce(v_amount, 0) <= 0 then
    raise exception 'Enter the amount received, above zero.';
  end if;

  if v_sale is not null then
    select * into v_row from public.sales where id = v_sale;
    if v_row.id is null then
      raise exception 'That invoice no longer exists. Refresh the page and try again.';
    end if;
    if v_row.customer_id <> v_customer then
      raise exception 'Invoice % is for a different customer, not %. Pick an invoice of % or leave the invoice empty.',
        v_row.invoice_no, v_name, v_name;
    end if;
    if v_row.status = 'void' then
      raise exception 'Invoice % is void, so a payment cannot be linked to it.', v_row.invoice_no;
    end if;
  end if;

  insert into public.customer_payments (customer_id, sale_id, payment_date, amount, method, reference, note)
  values (v_customer, v_sale, coalesce((p->>'payment_date')::date, current_date), v_amount,
    coalesce(nullif(p->>'method', ''), 'cash'), coalesce(p->>'reference', ''), coalesce(p->>'note', ''))
  returning id into v_id;
  return v_id;
end $$;


-- Ledgers: need the balances permission (they read payments through RLS).
create or replace function public.supplier_ledger(p_supplier_id uuid, p_from date default null, p_to date default null)
returns table (
  entry_date date, kind text, entry_id uuid, purchase_id uuid, ref text,
  description text, debit numeric, credit numeric, balance numeric
)
language plpgsql stable
as $$
declare v_open numeric;
begin
  perform public.require_perm('balances', 'see a supplier ledger');

  select opening_balance into v_open from public.suppliers where id = p_supplier_id;
  if v_open is null then
    raise exception 'That supplier no longer exists.';
  end if;

  if p_from is not null then
    v_open := v_open
      + coalesce((select sum(pu.total) from public.purchases pu
                  where pu.supplier_id = p_supplier_id and pu.status = 'posted' and pu.purchase_date < p_from), 0)
      - coalesce((select sum(sp.amount) from public.supplier_payments sp
                  where sp.supplier_id = p_supplier_id and sp.status = 'posted' and sp.payment_date < p_from), 0);
  end if;

  return query
  with e as (
    select p_from as d, 0 as ord, null::timestamptz as ts, 'opening'::text as k, null::uuid as eid, null::uuid as pid, ''::text as r,
      case when p_from is null then 'Opening balance' else 'Balance brought forward' end as descr,
      greatest(v_open, 0) as dr, greatest(-v_open, 0) as cr
    union all
    select pu.purchase_date, 1, pu.created_at, 'purchase', pu.id, pu.id, pu.purchase_no,
      'Purchase' || case when pu.supplier_ref <> '' then ', their bill ' || pu.supplier_ref else '' end,
      pu.total, 0::numeric
    from public.purchases pu
    where pu.supplier_id = p_supplier_id and pu.status = 'posted'
      and (p_from is null or pu.purchase_date >= p_from) and (p_to is null or pu.purchase_date <= p_to)
    union all
    select sp.payment_date, 1, sp.created_at, 'payment', sp.id, sp.purchase_id,
      coalesce(pu.purchase_no, ''),
      'Payment, ' || sp.method || case when sp.reference <> '' then ' (' || sp.reference || ')' else '' end,
      0::numeric, sp.amount
    from public.supplier_payments sp
    left join public.purchases pu on pu.id = sp.purchase_id
    where sp.supplier_id = p_supplier_id and sp.status = 'posted'
      and (p_from is null or sp.payment_date >= p_from) and (p_to is null or sp.payment_date <= p_to)
  )
  select e.d, e.k, e.eid, e.pid, e.r, e.descr, e.dr, e.cr,
    sum(e.dr - e.cr) over (order by e.ord, e.d, e.ts rows between unbounded preceding and current row)
  from e
  order by e.ord, e.d, e.ts;
end $$;


create or replace function public.customer_ledger(p_customer_id uuid, p_from date default null, p_to date default null)
returns table (
  entry_date date, kind text, entry_id uuid, sale_id uuid, ref text,
  description text, debit numeric, credit numeric, balance numeric
)
language plpgsql stable
as $$
declare v_open numeric;
begin
  perform public.require_perm('balances', 'see a customer ledger');

  select opening_balance into v_open from public.customers where id = p_customer_id;
  if v_open is null then
    raise exception 'That customer no longer exists.';
  end if;

  if p_from is not null then
    v_open := v_open
      + coalesce((select sum(s.total) from public.sales s
                  where s.customer_id = p_customer_id and s.status = 'posted' and s.sale_date < p_from), 0)
      - coalesce((select sum(cp.amount) from public.customer_payments cp
                  where cp.customer_id = p_customer_id and cp.status = 'posted' and cp.payment_date < p_from), 0);
  end if;

  return query
  with e as (
    select p_from as d, 0 as ord, null::timestamptz as ts, 'opening'::text as k, null::uuid as eid, null::uuid as sid, ''::text as r,
      case when p_from is null then 'Opening balance' else 'Balance brought forward' end as descr,
      greatest(v_open, 0) as dr, greatest(-v_open, 0) as cr
    union all
    select s.sale_date, 1, s.created_at, 'invoice', s.id, s.id, s.invoice_no, 'Invoice'::text, s.total, 0::numeric
    from public.sales s
    where s.customer_id = p_customer_id and s.status = 'posted'
      and (p_from is null or s.sale_date >= p_from) and (p_to is null or s.sale_date <= p_to)
    union all
    select cp.payment_date, 1, cp.created_at, 'payment', cp.id, cp.sale_id, coalesce(s.invoice_no, ''),
      'Payment, ' || cp.method || case when cp.reference <> '' then ' (' || cp.reference || ')' else '' end,
      0::numeric, cp.amount
    from public.customer_payments cp
    left join public.sales s on s.id = cp.sale_id
    where cp.customer_id = p_customer_id and cp.status = 'posted'
      and (p_from is null or cp.payment_date >= p_from) and (p_to is null or cp.payment_date <= p_to)
  )
  select e.d, e.k, e.eid, e.sid, e.r, e.descr, e.dr, e.cr,
    sum(e.dr - e.cr) over (order by e.ord, e.d, e.ts rows between unbounded preceding and current row)
  from e
  order by e.ord, e.d, e.ts;
end $$;


-- ---------------------------------------------------------------
-- Reports: need the reports permission. Ageing also needs balances, since
-- it is built from payments.
-- ---------------------------------------------------------------
create or replace function public.report_trade_series(p_from date, p_to date, p_grain text default 'day')
returns table (period date, sales numeric, invoices int, purchases numeric, bills int)
language plpgsql stable
as $$
#variable_conflict use_column
begin
  perform public.require_perm('reports', 'see sales and purchase reports');
  perform public.report_check_range(p_from, p_to, p_grain);
  return query
  select pr.period,
    coalesce(s.total, 0)::numeric, coalesce(s.n, 0)::int,
    coalesce(pu.total, 0)::numeric, coalesce(pu.n, 0)::int
  from public.report_periods(p_from, p_to, p_grain) pr
  left join (
    select date_trunc(p_grain, sale_date)::date as d, sum(total) as total, count(*) as n
    from public.sales where status = 'posted' and sale_date between p_from and p_to
    group by 1
  ) s on s.d = pr.period
  left join (
    select date_trunc(p_grain, purchase_date)::date as d, sum(total) as total, count(*) as n
    from public.purchases where status = 'posted' and purchase_date between p_from and p_to
    group by 1
  ) pu on pu.d = pr.period
  order by pr.period;
end $$;


create or replace function public.report_top_customers(p_from date, p_to date, p_limit int default 10)
returns table (customer_id uuid, name text, invoices int, total numeric)
language plpgsql stable
as $$
#variable_conflict use_column
begin
  perform public.require_perm('reports', 'see sales reports');
  perform public.report_check_range(p_from, p_to, 'month');
  return query
  select c.id, c.name, count(*)::int, sum(s.total)
  from public.sales s join public.customers c on c.id = s.customer_id
  where s.status = 'posted' and s.sale_date between p_from and p_to
  group by c.id, c.name
  order by 4 desc, 2
  limit p_limit;
end $$;


create or replace function public.report_top_suppliers(p_from date, p_to date, p_limit int default 10)
returns table (supplier_id uuid, name text, bills int, total numeric)
language plpgsql stable
as $$
#variable_conflict use_column
begin
  perform public.require_perm('reports', 'see purchase reports');
  perform public.report_check_range(p_from, p_to, 'month');
  return query
  select su.id, su.name, count(*)::int, sum(p.total)
  from public.purchases p join public.suppliers su on su.id = p.supplier_id
  where p.status = 'posted' and p.purchase_date between p_from and p_to
  group by su.id, su.name
  order by 4 desc, 2
  limit p_limit;
end $$;


create or replace function public.report_top_products(p_from date, p_to date, p_limit int default 5)
returns table (item_id uuid, name text, unit text, qty numeric, amount numeric)
language plpgsql stable
as $$
#variable_conflict use_column
begin
  perform public.require_perm('reports', 'see sales reports');
  perform public.report_check_range(p_from, p_to, 'month');
  return query
  select i.id, i.name, u.short_name, sum(sl.qty), sum(sl.amount)
  from public.sale_lines sl
  join public.sales s on s.id = sl.sale_id and s.status = 'posted'
  join public.items i on i.id = sl.item_id
  join public.units u on u.id = i.unit_id
  where s.sale_date between p_from and p_to
  group by i.id, i.name, u.short_name
  order by 5 desc, 2
  limit p_limit;
end $$;


create or replace function public.report_material_use(p_from date, p_to date, p_grain text default 'day')
returns table (period date, item_id uuid, name text, unit text, used numeric, expected numeric)
language plpgsql stable
as $$
#variable_conflict use_column
begin
  perform public.require_perm('reports', 'see material reports');
  perform public.report_check_range(p_from, p_to, p_grain);
  return query
  with mats as (
    select distinct pc.raw_item_id as id
    from public.production_consumption pc
    join public.production_runs r on r.id = pc.run_id
    where r.status = 'posted' and r.run_date between p_from and p_to
  ),
  use_ as (
    select date_trunc(p_grain, r.run_date)::date as d, pc.raw_item_id as id,
      sum(pc.qty) as qty, sum(pc.expected_qty) as expected
    from public.production_consumption pc
    join public.production_runs r on r.id = pc.run_id
    where r.status = 'posted' and r.run_date between p_from and p_to
    group by 1, 2
  )
  select pr.period, i.id, i.name, un.short_name, coalesce(x.qty, 0)::numeric, x.expected
  from public.report_periods(p_from, p_to, p_grain) pr
  cross join mats
  join public.items i on i.id = mats.id
  join public.units un on un.id = i.unit_id
  left join use_ x on x.d = pr.period and x.id = mats.id
  order by i.name, pr.period;
end $$;


create or replace function public.report_material_summary(p_from date, p_to date)
returns table (item_id uuid, name text, unit text, used numeric, expected numeric,
               difference numeric, difference_pct numeric, runs int)
language plpgsql stable
as $$
#variable_conflict use_column
begin
  perform public.require_perm('reports', 'see material reports');
  perform public.report_check_range(p_from, p_to, 'month');
  return query
  select i.id, i.name, u.short_name,
    sum(pc.qty),
    sum(pc.expected_qty),
    -- Only lines that had a recipe amount count toward the difference.
    sum(pc.qty - pc.expected_qty) filter (where pc.expected_qty is not null),
    round(100 * sum(pc.qty - pc.expected_qty) filter (where pc.expected_qty is not null)
      / nullif(sum(pc.expected_qty), 0), 1),
    count(distinct r.id)::int
  from public.production_consumption pc
  join public.production_runs r on r.id = pc.run_id and r.status = 'posted'
  join public.items i on i.id = pc.raw_item_id
  join public.units u on u.id = i.unit_id
  where r.run_date between p_from and p_to
  group by i.id, i.name, u.short_name
  order by 2;
end $$;


create or replace function public.report_stock_value()
returns table (category_id uuid, category text, kind text, items int, value numeric, unpriced int)
language plpgsql stable
as $$
#variable_conflict use_column
begin
  perform public.require_perm('reports', 'see stock value');
  return query
  select s.category_id, s.category_name, s.kind, count(*)::int,
    round(sum(greatest(s.on_hand, 0) * ic.unit_cost), 2),
    count(*) filter (where s.on_hand > 0 and not ic.cost_known)::int
  from public.item_stock s
  join public.item_costs ic on ic.item_id = s.id
  where s.active
  group by s.category_id, s.category_name, s.kind
  order by 5 desc nulls last, 2;
end $$;


create or replace function public.report_stock_flow(p_from date, p_to date, p_grain text default 'month')
returns table (period date, value_in numeric, value_out numeric)
language plpgsql stable
as $$
#variable_conflict use_column
begin
  perform public.require_perm('reports', 'see stock value');
  perform public.report_check_range(p_from, p_to, p_grain);
  return query
  with f as (
    select date_trunc(p_grain, sm.movement_date)::date as d,
      sum(case when sm.qty > 0 then sm.qty * ic.unit_cost else 0 end) as vin,
      sum(case when sm.qty < 0 then -sm.qty * ic.unit_cost else 0 end) as vout
    from public.stock_movements sm
    join public.item_costs ic on ic.item_id = sm.item_id
    where sm.movement_date between p_from and p_to
    group by 1
  )
  select pr.period, round(coalesce(f.vin, 0), 2), round(coalesce(f.vout, 0), 2)
  from public.report_periods(p_from, p_to, p_grain) pr
  left join f on f.d = pr.period
  order by pr.period;
end $$;


create or replace function public.report_ageing(p_as_of date default current_date)
returns table (side text, party_id uuid, name text, bucket text, amount numeric)
language plpgsql stable
as $$
#variable_conflict use_column
begin
  perform public.require_perm('reports', 'see balances and ageing');
  perform public.require_perm('balances', 'see balances and ageing');
  return query
  with docs as (
    select 'receivable'::text as side, s.customer_id as pid, s.sale_date as d, s.total as amt, s.created_at as ts
    from public.sales s where s.status = 'posted' and s.sale_date <= p_as_of
    union all
    select 'payable', p.supplier_id, p.purchase_date, p.total, p.created_at
    from public.purchases p where p.status = 'posted' and p.purchase_date <= p_as_of
  ),
  bal as (
    select 'receivable'::text as side, id as pid, name, balance from public.customer_balances where balance > 0
    union all
    select 'payable', id, name, balance from public.supplier_balances where balance > 0
  ),
  newest_first as (
    select b.side, b.pid, b.name, b.balance, d.d, d.amt,
      coalesce(sum(d.amt) over (partition by b.side, b.pid order by d.d desc, d.ts desc
        rows between unbounded preceding and 1 preceding), 0) as before_this
    from bal b
    left join docs d on d.side = b.side and d.pid = b.pid
  ),
  owed as (
    -- The part of each bill still owed: what is left of the balance after newer bills.
    select side, pid, name, d, greatest(least(amt, balance - before_this), 0) as amt
    from newest_first where d is not null
    union all
    -- Anything the bills do not explain (opening balance) is the oldest.
    select side, pid, name, null::date, greatest(balance - coalesce(sum_amt, 0), 0)
    from (select b.side, b.pid, b.name, b.balance, sum(d.amt) as sum_amt
          from bal b left join docs d on d.side = b.side and d.pid = b.pid
          group by b.side, b.pid, b.name, b.balance) t
  )
  select o.side, o.pid, o.name,
    case when o.d is null or p_as_of - o.d > 60 then 'Over 60 days'
         when p_as_of - o.d > 30 then '31 to 60 days'
         else '0 to 30 days' end,
    round(sum(o.amt), 2)
  from owed o
  where o.amt > 0
  group by 1, 2, 3, 4
  order by 1, 3, 4;
end $$;


create or replace function public.report_profit(p_from date, p_to date, p_grain text default 'month')
returns table (period date, revenue numeric, cost numeric, gross_profit numeric, unpriced_lines int)
language plpgsql stable
as $$
#variable_conflict use_column
begin
  perform public.require_perm('reports', 'see profit');
  perform public.report_check_range(p_from, p_to, p_grain);
  return query
  with rev as (
    select date_trunc(p_grain, s.sale_date)::date as d, sum(s.subtotal - s.discount) as revenue
    from public.sales s
    where s.status = 'posted' and s.sale_date between p_from and p_to
    group by 1
  ),
  cst as (
    select date_trunc(p_grain, s.sale_date)::date as d,
      sum(sl.qty * ic.unit_cost) as cost,
      count(*) filter (where not ic.cost_known) as unpriced
    from public.sale_lines sl
    join public.sales s on s.id = sl.sale_id and s.status = 'posted'
    join public.item_costs ic on ic.item_id = sl.item_id
    where s.sale_date between p_from and p_to
    group by 1
  )
  select pr.period,
    round(coalesce(rev.revenue, 0), 2),
    round(coalesce(cst.cost, 0), 2),
    round(coalesce(rev.revenue, 0) - coalesce(cst.cost, 0), 2),
    coalesce(cst.unpriced, 0)::int
  from public.report_periods(p_from, p_to, p_grain) pr
  left join rev on rev.d = pr.period
  left join cst on cst.d = pr.period
  order by pr.period;
end $$;


-- ---------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------
drop policy supplier_payments_admin_read on public.supplier_payments;
drop policy supplier_payments_admin_insert on public.supplier_payments;
create policy supplier_payments_read on public.supplier_payments
for select to authenticated using (public.has_perm('balances'));
create policy supplier_payments_insert on public.supplier_payments
for insert to authenticated with check (public.has_perm('payments'));

drop policy customer_payments_admin_read on public.customer_payments;
drop policy customer_payments_admin_insert on public.customer_payments;
create policy customer_payments_read on public.customer_payments
for select to authenticated using (public.has_perm('balances'));
create policy customer_payments_insert on public.customer_payments
for insert to authenticated with check (public.has_perm('payments'));

drop policy customers_staff_insert on public.customers;
create policy customers_staff_insert on public.customers
for insert to authenticated with check (public.has_perm('customers'));
drop policy suppliers_staff_insert on public.suppliers;
create policy suppliers_staff_insert on public.suppliers
for insert to authenticated with check (public.has_perm('suppliers'));

drop policy purchases_staff_insert on public.purchases;
create policy purchases_staff_insert on public.purchases
for insert to authenticated with check (public.has_perm('purchases'));
drop policy purchase_lines_staff_insert on public.purchase_lines;
create policy purchase_lines_staff_insert on public.purchase_lines
for insert to authenticated with check (public.has_perm('purchases'));

drop policy production_runs_staff_insert on public.production_runs;
create policy production_runs_staff_insert on public.production_runs
for insert to authenticated with check (public.has_perm('production'));
drop policy production_consumption_staff_insert on public.production_consumption;
create policy production_consumption_staff_insert on public.production_consumption
for insert to authenticated with check (public.has_perm('production'));

-- Functions are for signed-in users only (as in 0005, for the new ones).
revoke execute on function public.has_perm(text), public.require_perm(text, text) from public, anon;
grant execute on function public.has_perm(text), public.require_perm(text, text) to authenticated, service_role;
