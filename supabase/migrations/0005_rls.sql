-- 0005 row level security. This is the real access control; the app's own
-- role checks are a second fence, and hiding a menu link is only cosmetic.
--
-- Admin:  everything.
-- Worker: reads the business data, records purchases, sales, payments and
--         production, adds customers and suppliers. Cannot edit or delete past
--         entries, change items, settings or users, or read the activity log.

do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'settings', 'item_categories', 'units', 'brands', 'sizes', 'microns', 'colors',
    'items', 'stock_movements', 'suppliers', 'customers', 'purchases', 'purchase_lines',
    'supplier_payments', 'sales', 'sale_lines', 'customer_payments', 'recipes', 'recipe_lines',
    'production_runs', 'production_consumption', 'activity_log', 'doc_counters'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Read access for every signed-in, active staff member
do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'settings', 'item_categories', 'units', 'brands', 'sizes', 'microns', 'colors',
    'items', 'stock_movements', 'suppliers', 'customers', 'purchases', 'purchase_lines',
    'sales', 'sale_lines', 'customer_payments', 'recipes', 'recipe_lines',
    'production_runs', 'production_consumption'
  ] loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.is_staff())',
      t || '_read', t);
  end loop;
end $$;

-- Admin-only writes: setup data, items, recipes, users, settings
do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'settings', 'item_categories', 'units', 'brands', 'sizes', 'microns', 'colors',
    'items', 'recipes', 'recipe_lines'
  ] loop
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.is_admin())',
      t || '_admin_insert', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())',
      t || '_admin_update', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (public.is_admin())',
      t || '_admin_delete', t);
  end loop;
end $$;

-- Day-to-day entries: any staff member can add; only admins can change.
-- Nothing here is ever deleted; documents are voided instead.
do $$
declare t text;
begin
  foreach t in array array[
    'stock_movements', 'suppliers', 'customers', 'purchases', 'purchase_lines',
    'sales', 'sale_lines', 'customer_payments',
    'production_runs', 'production_consumption'
  ] loop
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.is_staff())',
      t || '_staff_insert', t);
  end loop;

  foreach t in array array[
    'suppliers', 'customers', 'purchases', 'sales',
    'customer_payments', 'production_runs'
  ] loop
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())',
      t || '_admin_update', t);
  end loop;
end $$;

-- Money paid to suppliers is for admins only (decided 2026-10-03): workers
-- record purchases but do not see or record supplier payments.
create policy supplier_payments_admin_read on public.supplier_payments
for select to authenticated using (public.is_admin());
create policy supplier_payments_admin_insert on public.supplier_payments
for insert to authenticated with check (public.is_admin());
create policy supplier_payments_admin_update on public.supplier_payments
for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- A deactivated or non-admin user can still read their own profile, so the
-- app can tell them why they were signed out.
create policy profiles_read_own on public.profiles
for select to authenticated using (id = auth.uid());

-- Activity log: admins read; nobody writes directly (triggers do).
create policy activity_log_admin_read on public.activity_log
for select to authenticated using (public.is_admin());

-- doc_counters has RLS on and no policies: only next_doc_no (security
-- definer) touches it.

-- Functions are for signed-in users only
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated, service_role;
