# Changelog

## 2026-10-03: Phase 2 (purchases and suppliers)

- Decision: supplier balances, the supplier ledger, supplier payments and
  voiding are admin-only. Workers record purchases (without a payment) and
  add suppliers. Enforced by RLS on `supplier_payments`, by `post_purchase`
  refusing a payment from a worker, and by the pages.
- Database: `record_supplier_payment`, `void_supplier_payment` (reason kept
  in `void_reason`), `supplier_ledger` (running balance worked out in SQL,
  with a brought-forward line when a start date is set), `purchase_list`
  view with paid and payment status, `purchase_totals`, `supplier_totals`.
  A payment cannot be linked to another supplier's bill or a void bill.
  Voiding a purchase also voids its payments, with the reason recorded.
- Pages: Purchases list with month totals, New Purchase (reference
  "Create Purchase Order" layout, live total preview, payment for admins),
  purchase detail with payments and void, Suppliers list with balances, add
  and edit supplier, supplier ledger with payments and a payment form.
- Tables now switch to cards below 1280px instead of 768px: with the
  sidebar open, the 1024 to 1280 laptop widths made the purchases, stock,
  activity and ledger tables scroll sideways and hid the balance column.
  The activity table folds its Module column under the action until 1536px.
- Fixed: an icon component was passed from a server page into the void
  dialog (a client component), which crashed the purchase page; icons are
  now passed as elements.

## 2026-10-03: Phase 1 (foundation)

- Requirements taken from the client's three Urdu voice notes (transcribed
  with Whisper) and the company flyer. Tape sizes as corrected by the user:
  24x72, 46x72, 46x70, 60x72, 69x72, 72x72 (mm x yd). The automatic
  translation had heard 79mm and 48mm; the user's list is the one seeded.
- Database: items, lookup tables, stock ledger with a no-negative-stock guard,
  purchases, sales, payments, balances, recipes, production runs, voiding,
  gapless document numbers, activity log triggers, RLS for admin vs worker.
  Tested on a local Postgres with `supabase/tests/run.sh`.
  - Document numbers first used Postgres sequences; a failed save skipped a
    number (INV-00002 after a refused sale). Replaced with a locked counter
    row so invoice numbers have no gaps.
  - The stock guard first ran as the signed-in user; for a worker it could not
    lock the item row (no update right), so the error lost the item's name.
    It now runs as security definer.
  - Recipe changes were first logged by a trigger per line; replaced by one
    entry per save from `save_recipe`, listing the whole recipe.
- App shell copied from the reference design: collapsible sidebar (icon rail
  with tooltips on desktop, drawer on phones), header, light/dark toggle.
  - Tooltips on the collapsed rail were clipped by the scrolling menu; the
    rail now has no scroll box.
- Pages: Dashboard (stock KPIs and alerts), Stock with item history, Opening
  stock / Adjust, Raw Materials and Products (add, edit, mark inactive),
  Activity (filter by user, module, action, dates, search; view changes;
  CSV export), Users, Settings (company and invoice, categories, brands,
  sizes, microns, colours, units, recipes). Later-phase sections show a
  placeholder that says what is coming.
- Demo mode: with no database configured the app runs on sample data with
  saving switched off, so the client can review the screens now.
