-- 0001 core: users, settings, lookup tables, items and the stock ledger.
-- Every rule that protects stock lives here, not in the app.

-- ---------------------------------------------------------------
-- Users and roles
-- ---------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null check (length(trim(full_name)) > 0),
  role        text not null default 'worker' check (role in ('admin', 'worker')),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Role lookups used by RLS policies and functions. security definer so the
-- policy on profiles itself does not recurse.
create or replace function public.current_app_role()
returns text
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and active
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(public.current_app_role() = 'admin', false)
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.current_app_role() is not null
$$;

create or replace function public.require_admin(p_what text)
returns void
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an admin can %. Ask an admin to do this for you.', p_what;
  end if;
end $$;

-- ---------------------------------------------------------------
-- Company and invoice settings (exactly one row)
-- ---------------------------------------------------------------
create table public.settings (
  id               int primary key default 1 check (id = 1),
  company_name     text not null default 'Ahmed Munir Packaging Industry',
  short_name       text not null default 'AM Packaging',
  tagline          text not null default 'Your Trusted Packaging Partner',
  address          text not null default '265-D, Small Industrial Estate, Sargodha Road, Faisalabad',
  phone            text not null default '',
  email            text not null default '',
  ntn              text not null default '',
  strn             text not null default '',
  logo_url         text not null default '',
  gst_enabled      boolean not null default false,
  gst_rate         numeric(5,2) not null default 18 check (gst_rate >= 0 and gst_rate <= 100),
  invoice_prefix   text not null default 'INV-',
  purchase_prefix  text not null default 'PUR-',
  production_prefix text not null default 'PRD-',
  invoice_terms    text not null default '',
  invoice_footer   text not null default 'Thank you for your business.',
  updated_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Lookup tables, all editable from Settings
-- ---------------------------------------------------------------
create table public.item_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (length(trim(name)) > 0),
  kind        text not null check (kind in ('raw', 'finished')),
  active      boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table public.units (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (length(trim(name)) > 0),
  short_name  text not null check (length(trim(short_name)) > 0),
  created_at  timestamptz not null default now()
);

create table public.brands (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (length(trim(name)) > 0),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.sizes (
  id          uuid primary key default gen_random_uuid(),
  width_mm    numeric(8,2) not null check (width_mm > 0),
  length_yd   numeric(8,2) not null check (length_yd > 0),
  label       text generated always as (
                trim(trailing '.' from trim(trailing '0' from width_mm::text)) || 'mm x ' ||
                trim(trailing '.' from trim(trailing '0' from length_yd::text)) || 'yd'
              ) stored,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (width_mm, length_yd)
);

create table public.microns (
  id          uuid primary key default gen_random_uuid(),
  value       numeric(6,2) not null unique check (value > 0),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.colors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (length(trim(name)) > 0),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Items: raw materials and finished products in one table
-- ---------------------------------------------------------------
create table public.items (
  id                uuid primary key default gen_random_uuid(),
  kind              text not null check (kind in ('raw', 'finished')),
  category_id       uuid not null references public.item_categories (id),
  name              text not null check (length(trim(name)) > 0),
  code              text unique,
  brand_id          uuid references public.brands (id),
  size_id           uuid references public.sizes (id),
  micron_id         uuid references public.microns (id),
  color_id          uuid references public.colors (id),
  unit_id           uuid not null references public.units (id),
  rolls_per_carton  int check (rolls_per_carton is null or rolls_per_carton > 0),
  low_stock_level   numeric(14,3) not null default 0 check (low_stock_level >= 0),
  default_rate      numeric(14,2) not null default 0 check (default_rate >= 0),
  notes             text not null default '',
  active            boolean not null default true,
  created_by        uuid default auth.uid() references public.profiles (id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index items_category_idx on public.items (category_id);
create index items_kind_idx on public.items (kind);

-- An item's kind must match its category's kind, so a raw material can
-- never be sold and a product can never be bought as raw stock by mistake.
create or replace function public.items_check_kind()
returns trigger
language plpgsql
as $$
declare v_kind text; v_name text;
begin
  select kind, name into v_kind, v_name from public.item_categories where id = new.category_id;
  if v_kind is distinct from new.kind then
    raise exception 'The category "%" is for % items, but this item is marked as %. Pick a matching category.',
      v_name,
      case v_kind when 'raw' then 'raw material' else 'finished product' end,
      case new.kind when 'raw' then 'a raw material' else 'a finished product' end;
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger items_check_kind
before insert or update on public.items
for each row execute function public.items_check_kind();

-- ---------------------------------------------------------------
-- Stock ledger: every in and out, never edited
-- ---------------------------------------------------------------
create table public.stock_movements (
  id             bigint generated always as identity primary key,
  item_id        uuid not null references public.items (id),
  movement_date  date not null default current_date,
  qty            numeric(14,3) not null check (qty <> 0),
  type           text not null check (type in
                   ('opening', 'purchase', 'production_in', 'production_use', 'sale', 'adjustment')),
  ref_table      text,
  ref_id         uuid,
  note           text not null default '',
  created_by     uuid default auth.uid() references public.profiles (id),
  created_at     timestamptz not null default now()
);

create index stock_movements_item_idx on public.stock_movements (item_id, movement_date);
create index stock_movements_ref_idx on public.stock_movements (ref_table, ref_id);

-- Refuse anything that would take stock below zero, and keep opening stock
-- and manual adjustments for admins. The item row is locked so two people
-- selling the last carton at the same moment cannot both succeed.
-- security definer: a worker has no update right on items, so a plain
-- "for update" lock would hide the row from them and the message would lose
-- the item's name.
create or replace function public.stock_movements_guard()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_on_hand numeric;
  v_name    text;
  v_unit    text;
begin
  if new.type in ('opening', 'adjustment') and not public.is_admin() then
    raise exception 'Only an admin can enter opening stock or adjust stock. Ask an admin to do this for you.';
  end if;

  if new.type = 'adjustment' and length(trim(new.note)) = 0 then
    raise exception 'Write a reason for this stock adjustment, for example "counted 3 cartons short".';
  end if;

  select i.name, u.short_name into v_name, v_unit
  from public.items i join public.units u on u.id = i.unit_id
  where i.id = new.item_id
  for update of i;

  if new.qty < 0 then
    select coalesce(sum(qty), 0) into v_on_hand
    from public.stock_movements where item_id = new.item_id;

    if v_on_hand + new.qty < 0 then
      raise exception 'Not enough stock of "%". There are % % in stock but this needs % %. Record the purchase or production first, or reduce the quantity.',
        v_name, rtrim(to_char(v_on_hand, 'FM999,999,999,990.999'), '.'), v_unit,
        rtrim(to_char(-new.qty, 'FM999,999,999,990.999'), '.'), v_unit;
    end if;
  end if;

  return new;
end $$;

create trigger stock_movements_guard
before insert on public.stock_movements
for each row execute function public.stock_movements_guard();

create or replace function public.forbid_change()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Entries in % cannot be changed or deleted. Record a new correcting entry instead.', tg_table_name;
end $$;

create trigger stock_movements_append_only
before update or delete on public.stock_movements
for each row execute function public.forbid_change();

-- Current stock per item. Totals come from the ledger, never from a cached column.
create or replace view public.item_stock
with (security_invoker = true)
as
select
  i.id,
  i.kind,
  i.name,
  i.code,
  i.category_id,
  c.name            as category_name,
  i.brand_id,
  b.name            as brand_name,
  i.size_id,
  s.label           as size_label,
  i.micron_id,
  m.value           as micron_value,
  i.color_id,
  col.name          as color_name,
  i.unit_id,
  u.short_name      as unit,
  i.rolls_per_carton,
  i.low_stock_level,
  i.default_rate,
  i.notes,
  i.active,
  i.created_at,
  coalesce(sm.on_hand, 0) as on_hand,
  case
    when coalesce(sm.on_hand, 0) <= 0 then 'out'
    when coalesce(sm.on_hand, 0) <= i.low_stock_level then 'low'
    else 'in'
  end as stock_status
from public.items i
join public.item_categories c on c.id = i.category_id
join public.units u on u.id = i.unit_id
left join public.brands b on b.id = i.brand_id
left join public.sizes s on s.id = i.size_id
left join public.microns m on m.id = i.micron_id
left join public.colors col on col.id = i.color_id
left join (
  select item_id, sum(qty) as on_hand from public.stock_movements group by item_id
) sm on sm.item_id = i.id;

-- Admin-only stock entry: opening stock or an adjustment, through one function
-- so the reason and the role check cannot be skipped.
create or replace function public.adjust_stock(
  p_item_id uuid, p_qty numeric, p_type text, p_note text, p_date date default current_date
)
returns bigint
language plpgsql
as $$
declare v_id bigint;
begin
  perform public.require_admin('enter opening stock or adjust stock');
  if p_type not in ('opening', 'adjustment') then
    raise exception 'Stock can only be entered here as opening stock or an adjustment.';
  end if;
  if p_qty is null or p_qty = 0 then
    raise exception 'Enter a quantity other than zero.';
  end if;
  insert into public.stock_movements (item_id, movement_date, qty, type, note)
  values (p_item_id, coalesce(p_date, current_date), p_qty, p_type, coalesce(trim(p_note), ''))
  returning id into v_id;
  return v_id;
end $$;
