-- 0002 trade: suppliers, customers, purchases, sales and payments.
-- Purchases and sales post through one function each, so the document, its
-- lines, the stock movements and any payment are saved together or not at all.

create table public.suppliers (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (length(trim(name)) > 0),
  contact_person   text not null default '',
  phone            text not null default '',
  address          text not null default '',
  opening_balance  numeric(14,2) not null default 0,
  notes            text not null default '',
  active           boolean not null default true,
  created_by       uuid default auth.uid() references public.profiles (id),
  created_at       timestamptz not null default now()
);

create table public.customers (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (length(trim(name)) > 0),
  contact_person   text not null default '',
  phone            text not null default '',
  address          text not null default '',
  ntn              text not null default '',
  opening_balance  numeric(14,2) not null default 0,
  notes            text not null default '',
  active           boolean not null default true,
  created_by       uuid default auth.uid() references public.profiles (id),
  created_at       timestamptz not null default now()
);

-- Document numbers come from a counter row, not a sequence: a sequence skips a
-- number whenever a save fails, and invoice books are expected to have no gaps.
-- The row lock also makes two saves at the same moment take turns.
create table public.doc_counters (
  name     text primary key,
  last_no  bigint not null default 0
);

insert into public.doc_counters (name) values ('purchase'), ('invoice'), ('production');

-- ---------------------------------------------------------------
-- Purchases
-- ---------------------------------------------------------------
create table public.purchases (
  id              uuid primary key default gen_random_uuid(),
  purchase_no     text not null unique,
  supplier_id     uuid not null references public.suppliers (id),
  purchase_date   date not null default current_date,
  supplier_ref    text not null default '',
  subtotal        numeric(14,2) not null check (subtotal >= 0),
  discount        numeric(14,2) not null default 0 check (discount >= 0),
  gst_rate        numeric(5,2) not null default 0 check (gst_rate >= 0),
  gst_amount      numeric(14,2) not null default 0 check (gst_amount >= 0),
  other_charges   numeric(14,2) not null default 0 check (other_charges >= 0),
  total           numeric(14,2) not null check (total >= 0),
  notes           text not null default '',
  status          text not null default 'posted' check (status in ('posted', 'void')),
  void_reason     text not null default '',
  created_by      uuid default auth.uid() references public.profiles (id),
  created_at      timestamptz not null default now()
);

create table public.purchase_lines (
  id           uuid primary key default gen_random_uuid(),
  purchase_id  uuid not null references public.purchases (id) on delete cascade,
  item_id      uuid not null references public.items (id),
  qty          numeric(14,3) not null check (qty > 0),
  rate         numeric(14,2) not null check (rate >= 0),
  amount       numeric(14,2) generated always as (round(qty * rate, 2)) stored
);

create index purchases_supplier_idx on public.purchases (supplier_id, purchase_date);
create index purchase_lines_purchase_idx on public.purchase_lines (purchase_id);

create table public.supplier_payments (
  id            uuid primary key default gen_random_uuid(),
  supplier_id   uuid not null references public.suppliers (id),
  purchase_id   uuid references public.purchases (id),
  payment_date  date not null default current_date,
  amount        numeric(14,2) not null check (amount > 0),
  method        text not null default 'cash' check (method in ('cash', 'bank', 'cheque', 'online', 'other')),
  reference     text not null default '',
  note          text not null default '',
  status        text not null default 'posted' check (status in ('posted', 'void')),
  created_by    uuid default auth.uid() references public.profiles (id),
  created_at    timestamptz not null default now()
);

create index supplier_payments_supplier_idx on public.supplier_payments (supplier_id, payment_date);

-- ---------------------------------------------------------------
-- Sales
-- ---------------------------------------------------------------
create table public.sales (
  id              uuid primary key default gen_random_uuid(),
  invoice_no      text not null unique,
  customer_id     uuid not null references public.customers (id),
  sale_date       date not null default current_date,
  due_date        date,
  subtotal        numeric(14,2) not null check (subtotal >= 0),
  discount        numeric(14,2) not null default 0 check (discount >= 0),
  gst_rate        numeric(5,2) not null default 0 check (gst_rate >= 0),
  gst_amount      numeric(14,2) not null default 0 check (gst_amount >= 0),
  other_charges   numeric(14,2) not null default 0 check (other_charges >= 0),
  total           numeric(14,2) not null check (total >= 0),
  notes           text not null default '',
  status          text not null default 'posted' check (status in ('posted', 'void')),
  void_reason     text not null default '',
  created_by      uuid default auth.uid() references public.profiles (id),
  created_at      timestamptz not null default now()
);

create table public.sale_lines (
  id        uuid primary key default gen_random_uuid(),
  sale_id   uuid not null references public.sales (id) on delete cascade,
  item_id   uuid not null references public.items (id),
  qty       numeric(14,3) not null check (qty > 0),
  rate      numeric(14,2) not null check (rate >= 0),
  amount    numeric(14,2) generated always as (round(qty * rate, 2)) stored
);

create index sales_customer_idx on public.sales (customer_id, sale_date);
create index sale_lines_sale_idx on public.sale_lines (sale_id);

create table public.customer_payments (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references public.customers (id),
  sale_id       uuid references public.sales (id),
  payment_date  date not null default current_date,
  amount        numeric(14,2) not null check (amount > 0),
  method        text not null default 'cash' check (method in ('cash', 'bank', 'cheque', 'online', 'other')),
  reference     text not null default '',
  note          text not null default '',
  status        text not null default 'posted' check (status in ('posted', 'void')),
  created_by    uuid default auth.uid() references public.profiles (id),
  created_at    timestamptz not null default now()
);

create index customer_payments_customer_idx on public.customer_payments (customer_id, payment_date);

-- ---------------------------------------------------------------
-- Shared helpers for posting documents
-- ---------------------------------------------------------------
create or replace function public.next_doc_no(p_counter text)
returns text
language plpgsql security definer set search_path = public
as $$
declare v_prefix text; v_n bigint;
begin
  select case p_counter
    when 'purchase'   then purchase_prefix
    when 'invoice'    then invoice_prefix
    when 'production' then production_prefix
  end into v_prefix
  from public.settings where id = 1;

  update public.doc_counters set last_no = last_no + 1
  where name = p_counter
  returning last_no into v_n;

  if v_n is null then
    raise exception 'Unknown document type %.', p_counter;
  end if;
  return coalesce(v_prefix, '') || lpad(v_n::text, 5, '0');
end $$;

-- Totals are always worked out here, from the lines, so a figure typed in the
-- browser can never disagree with the lines it claims to add up.
create or replace function public.doc_totals(
  p_lines jsonb, p_discount numeric, p_gst_rate numeric, p_other numeric,
  out subtotal numeric, out gst_amount numeric, out total numeric
)
language plpgsql immutable
as $$
begin
  select coalesce(sum(round((l->>'qty')::numeric * (l->>'rate')::numeric, 2)), 0)
    into subtotal
  from jsonb_array_elements(p_lines) l;

  if coalesce(p_discount, 0) > subtotal then
    raise exception 'The discount (Rs %) is more than the items total (Rs %). Lower the discount.',
      to_char(p_discount, 'FM999,999,999,990.00'), to_char(subtotal, 'FM999,999,999,990.00');
  end if;

  gst_amount := round((subtotal - coalesce(p_discount, 0)) * coalesce(p_gst_rate, 0) / 100, 2);
  total := subtotal - coalesce(p_discount, 0) + gst_amount + coalesce(p_other, 0);
end $$;

create or replace function public.check_lines(p_lines jsonb, p_kind text, p_what text)
returns void
language plpgsql stable
as $$
declare l jsonb; v_kind text; v_name text;
begin
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'Add at least one item to this %.', p_what;
  end if;

  for l in select * from jsonb_array_elements(p_lines) loop
    if (l->>'item_id') is null then
      raise exception 'One of the rows has no item selected. Pick an item or remove the row.';
    end if;
    if coalesce((l->>'qty')::numeric, 0) <= 0 then
      raise exception 'Every row needs a quantity above zero.';
    end if;
    if coalesce((l->>'rate')::numeric, -1) < 0 then
      raise exception 'Every row needs a rate of zero or more.';
    end if;

    select kind, name into v_kind, v_name from public.items where id = (l->>'item_id')::uuid;
    if v_kind is null then
      raise exception 'One of the selected items no longer exists. Refresh the page and try again.';
    end if;
    if v_kind <> p_kind then
      raise exception '"%" is a %, so it cannot be added to a %.',
        v_name, case v_kind when 'raw' then 'raw material' else 'finished product' end, p_what;
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------
-- post_purchase: purchase + lines + stock in + optional payment
-- p = { supplier_id, purchase_date, supplier_ref, discount, gst_rate,
--       other_charges, notes, lines: [{item_id, qty, rate}],
--       payment: {amount, method, reference} }
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
  if not public.is_staff() then
    raise exception 'Sign in to record a purchase.';
  end if;
  if (p->>'supplier_id') is null then
    raise exception 'Pick the supplier for this purchase.';
  end if;

  perform public.check_lines(p->'lines', 'raw', 'purchase');
  select * into v_tot from public.doc_totals(
    p->'lines', (p->>'discount')::numeric, (p->>'gst_rate')::numeric, (p->>'other_charges')::numeric);

  if v_paid < 0 then
    raise exception 'The amount paid cannot be negative.';
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

-- ---------------------------------------------------------------
-- post_sale: invoice + lines + stock out + optional payment received
-- ---------------------------------------------------------------
create or replace function public.post_sale(p jsonb)
returns uuid
language plpgsql
as $$
declare
  v_id    uuid;
  v_no    text;
  v_date  date := coalesce((p->>'sale_date')::date, current_date);
  v_tot   record;
  l       jsonb;
  v_paid  numeric := coalesce((p->'payment'->>'amount')::numeric, 0);
begin
  if not public.is_staff() then
    raise exception 'Sign in to record a sale.';
  end if;
  if (p->>'customer_id') is null then
    raise exception 'Pick the customer for this sale.';
  end if;

  perform public.check_lines(p->'lines', 'finished', 'sale');
  select * into v_tot from public.doc_totals(
    p->'lines', (p->>'discount')::numeric, (p->>'gst_rate')::numeric, (p->>'other_charges')::numeric);

  if v_paid < 0 then
    raise exception 'The amount received cannot be negative.';
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

-- ---------------------------------------------------------------
-- Voiding (admin only). Nothing is deleted: the stock comes back through
-- reversing ledger entries and linked payments are voided too.
-- ---------------------------------------------------------------
create or replace function public.void_purchase(p_id uuid, p_reason text)
returns void
language plpgsql
as $$
declare v_row public.purchases; l record;
begin
  perform public.require_admin('void a purchase');
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

  update public.supplier_payments set status = 'void' where purchase_id = p_id;
  update public.purchases set status = 'void', void_reason = trim(p_reason) where id = p_id;
end $$;

create or replace function public.void_sale(p_id uuid, p_reason text)
returns void
language plpgsql
as $$
declare v_row public.sales; l record;
begin
  perform public.require_admin('void a sale');
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

  update public.customer_payments set status = 'void' where sale_id = p_id;
  update public.sales set status = 'void', void_reason = trim(p_reason) where id = p_id;
end $$;

-- ---------------------------------------------------------------
-- Balances. Positive customer balance = they owe us.
-- Positive supplier balance = we owe them.
-- ---------------------------------------------------------------
create or replace view public.customer_balances
with (security_invoker = true)
as
select
  c.id, c.name, c.phone, c.active, c.opening_balance,
  coalesce(s.billed, 0)   as billed,
  coalesce(pm.paid, 0)    as paid,
  c.opening_balance + coalesce(s.billed, 0) - coalesce(pm.paid, 0) as balance,
  s.last_sale
from public.customers c
left join (
  select customer_id, sum(total) as billed, max(sale_date) as last_sale
  from public.sales where status = 'posted' group by customer_id
) s on s.customer_id = c.id
left join (
  select customer_id, sum(amount) as paid
  from public.customer_payments where status = 'posted' group by customer_id
) pm on pm.customer_id = c.id;

create or replace view public.supplier_balances
with (security_invoker = true)
as
select
  sp.id, sp.name, sp.phone, sp.active, sp.opening_balance,
  coalesce(pu.billed, 0)  as billed,
  coalesce(pm.paid, 0)    as paid,
  sp.opening_balance + coalesce(pu.billed, 0) - coalesce(pm.paid, 0) as balance,
  pu.last_purchase
from public.suppliers sp
left join (
  select supplier_id, sum(total) as billed, max(purchase_date) as last_purchase
  from public.purchases where status = 'posted' group by supplier_id
) pu on pu.supplier_id = sp.id
left join (
  select supplier_id, sum(amount) as paid
  from public.supplier_payments where status = 'posted' group by supplier_id
) pm on pm.supplier_id = sp.id;
