-- 0007_reports.sql
-- Figures for the dashboard charts and the Reports page. Every money report is
-- admin-only (require_admin). Production output is for all staff, because
-- workers see it on their dashboard. All functions are read-only and run as
-- the caller, so row level security still applies on top.
--
-- Quantities are never added across units: a carton, a roll and a bundle are
-- different things. Anything that sums quantities groups by category and unit;
-- anything that sums across categories uses rupees.

-- ---------------------------------------------------------------
-- Periods: every day, week (Monday) or month between two dates, so a chart
-- shows a quiet day as zero instead of skipping it.
-- ---------------------------------------------------------------
create or replace function public.report_periods(p_from date, p_to date, p_grain text)
returns table (period date)
language sql immutable
as $$
  select gs::date
  from generate_series(
    date_trunc(p_grain, p_from::timestamp),
    date_trunc(p_grain, p_to::timestamp),
    ('1 ' || p_grain)::interval
  ) gs
$$;

create or replace function public.report_check_range(p_from date, p_to date, p_grain text)
returns void
language plpgsql immutable
as $$
begin
  if p_from is null or p_to is null then
    raise exception 'Pick a start and an end date for the report.';
  end if;
  if p_to < p_from then
    raise exception 'The end date (%) is before the start date (%). Swap them and try again.', p_to, p_from;
  end if;
  if p_grain not in ('day', 'week', 'month') then
    raise exception 'Reports can be grouped by day, week or month, not "%".', p_grain;
  end if;
  if p_grain = 'day' and p_to - p_from > 400 then
    raise exception 'That is too many days to show one by one. Group by week or month instead.';
  end if;
end $$;

-- ---------------------------------------------------------------
-- Unit cost of every item, used for stock value and profit.
--   Raw material: average purchase rate (all posted purchase lines).
--   Product: average material cost per unit over all posted runs, with each
--   material valued at its average purchase rate.
-- cost_known is false when there is nothing to work it out from yet.
-- ---------------------------------------------------------------
create or replace view public.item_costs
with (security_invoker = true)
as
with raw_cost as (
  select pl.item_id, sum(pl.amount) / nullif(sum(pl.qty), 0) as unit_cost
  from public.purchase_lines pl
  join public.purchases p on p.id = pl.purchase_id and p.status = 'posted'
  group by pl.item_id
),
run_cost as (
  select r.item_id,
    sum(pc.qty * coalesce(rc.unit_cost, 0)) as material_cost,
    bool_and(rc.unit_cost is not null) as all_priced
  from public.production_runs r
  join public.production_consumption pc on pc.run_id = r.id
  left join raw_cost rc on rc.item_id = pc.raw_item_id
  where r.status = 'posted'
  group by r.item_id
),
made as (
  select item_id, sum(qty_made) as qty_made
  from public.production_runs where status = 'posted'
  group by item_id
)
select
  i.id as item_id,
  i.kind,
  round(coalesce(
    case when i.kind = 'raw' then rc.unit_cost
         else ruc.material_cost / nullif(m.qty_made, 0) end, 0), 4) as unit_cost,
  case when i.kind = 'raw' then rc.unit_cost is not null
       else coalesce(ruc.all_priced, false) and coalesce(m.qty_made, 0) > 0 end as cost_known
from public.items i
left join raw_cost rc on rc.item_id = i.id
left join run_cost ruc on ruc.item_id = i.id
left join made m on m.item_id = i.id;

-- ---------------------------------------------------------------
-- Sales and purchases per period (rupees, invoice and bill totals).
-- ---------------------------------------------------------------
create or replace function public.report_trade_series(p_from date, p_to date, p_grain text default 'day')
returns table (period date, sales numeric, invoices int, purchases numeric, bills int)
language plpgsql stable
as $$
#variable_conflict use_column
begin
  perform public.require_admin('see sales and purchase reports');
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

-- Best customers, suppliers and products in a date range (rupees).
create or replace function public.report_top_customers(p_from date, p_to date, p_limit int default 10)
returns table (customer_id uuid, name text, invoices int, total numeric)
language plpgsql stable
as $$
#variable_conflict use_column
begin
  perform public.require_admin('see sales reports');
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
  perform public.require_admin('see purchase reports');
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
  perform public.require_admin('see sales reports');
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

-- ---------------------------------------------------------------
-- Production per period, per category, in that category's unit. For all
-- staff (the workers' dashboard shows it).
-- ---------------------------------------------------------------
create or replace function public.report_production_series(p_from date, p_to date, p_grain text default 'day')
returns table (period date, category_id uuid, category text, unit text, qty numeric, runs int)
language plpgsql stable
as $$
#variable_conflict use_column
begin
  if not public.is_staff() then
    raise exception 'Sign in to see production figures.';
  end if;
  perform public.report_check_range(p_from, p_to, p_grain);
  return query
  with cats as (
    select distinct c.id, c.name, c.sort_order, u.short_name as unit
    from public.items i
    join public.item_categories c on c.id = i.category_id
    join public.units u on u.id = i.unit_id
    where i.kind = 'finished' and c.active
  ),
  made as (
    select date_trunc(p_grain, r.run_date)::date as d, i.category_id, u.short_name as unit,
      sum(r.qty_made) as qty, count(*) as n
    from public.production_runs r
    join public.items i on i.id = r.item_id
    join public.units u on u.id = i.unit_id
    where r.status = 'posted' and r.run_date between p_from and p_to
    group by 1, 2, 3
  )
  select pr.period, c.id, c.name, c.unit, coalesce(m.qty, 0)::numeric, coalesce(m.n, 0)::int
  from public.report_periods(p_from, p_to, p_grain) pr
  cross join cats c
  left join made m on m.d = pr.period and m.category_id = c.id and m.unit = c.unit
  order by c.sort_order, c.name, c.unit, pr.period;
end $$;

-- Production per product in a range (for the table under the chart).
create or replace function public.report_production_by_product(p_from date, p_to date)
returns table (item_id uuid, name text, category text, unit text, qty numeric, runs int)
language plpgsql stable
as $$
#variable_conflict use_column
begin
  if not public.is_staff() then
    raise exception 'Sign in to see production figures.';
  end if;
  perform public.report_check_range(p_from, p_to, 'month');
  return query
  select i.id, i.name, c.name, u.short_name, sum(r.qty_made), count(*)::int
  from public.production_runs r
  join public.items i on i.id = r.item_id
  join public.item_categories c on c.id = i.category_id
  join public.units u on u.id = i.unit_id
  where r.status = 'posted' and r.run_date between p_from and p_to
  group by i.id, i.name, c.name, c.sort_order, u.short_name
  order by c.sort_order, 5 desc, 2;
end $$;

-- ---------------------------------------------------------------
-- Raw material use: per material per period (used and the recipe amount),
-- and a summary per material over the range.
-- ---------------------------------------------------------------
create or replace function public.report_material_use(p_from date, p_to date, p_grain text default 'day')
returns table (period date, item_id uuid, name text, unit text, used numeric, expected numeric)
language plpgsql stable
as $$
#variable_conflict use_column
begin
  perform public.require_admin('see material reports');
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
  perform public.require_admin('see material reports');
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

-- ---------------------------------------------------------------
-- Stock value (at average cost) by category, and stock in and out per
-- period valued the same way.
-- ---------------------------------------------------------------
create or replace function public.report_stock_value()
returns table (category_id uuid, category text, kind text, items int, value numeric, unpriced int)
language plpgsql stable
as $$
#variable_conflict use_column
begin
  perform public.require_admin('see stock value');
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
  perform public.require_admin('see stock value');
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

-- ---------------------------------------------------------------
-- Ageing of what customers owe us and what we owe suppliers. Payments are
-- taken to clear the oldest bills first, so whatever is still owed sits on
-- the newest ones. An opening balance counts as the oldest.
-- Buckets by days since the bill or invoice date: 0-30, 31-60, over 60.
-- ---------------------------------------------------------------
create or replace function public.report_ageing(p_as_of date default current_date)
returns table (side text, party_id uuid, name text, bucket text, amount numeric)
language plpgsql stable
as $$
#variable_conflict use_column
begin
  perform public.require_admin('see balances and ageing');
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

-- ---------------------------------------------------------------
-- Gross profit per month. Revenue is what the goods sold for (line amounts
-- less invoice discount; GST and freight are not income). Cost is the
-- quantity sold at each product's average cost of materials.
-- ---------------------------------------------------------------
create or replace function public.report_profit(p_from date, p_to date, p_grain text default 'month')
returns table (period date, revenue numeric, cost numeric, gross_profit numeric, unpriced_lines int)
language plpgsql stable
as $$
#variable_conflict use_column
begin
  perform public.require_admin('see profit');
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

grant execute on function
  public.report_trade_series(date, date, text),
  public.report_top_customers(date, date, int),
  public.report_top_suppliers(date, date, int),
  public.report_top_products(date, date, int),
  public.report_production_series(date, date, text),
  public.report_production_by_product(date, date),
  public.report_material_use(date, date, text),
  public.report_material_summary(date, date),
  public.report_stock_value(),
  public.report_stock_flow(date, date, text),
  public.report_ageing(date),
  public.report_profit(date, date, text)
to authenticated;
grant select on public.item_costs to authenticated;
