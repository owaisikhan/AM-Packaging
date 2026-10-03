# Changelog

## 2026-10-03: Dark mode and readability fixes

- Dark mode: the open list of a select was white with light text on Windows
  (user report with screenshot). Options now get a solid dark background,
  and use the app's own font (Inter, 16px, medium) in both themes.
- A contrast check now measures every piece of text on every page in both
  themes. It found the reference green (#22B573) used as text at 2.65:1 and
  red (#EF4444) at 3.8:1, below the 4.5:1 minimum. Green and red stay as
  fills (buttons, banner, icons); words and figures now use the `primary-ink`
  (#15803D, bright green in dark) and `danger-ink` (#DC2626, light red in
  dark) tokens. The red fill moved to #DC2626 so white button text passes.
  White text on the green buttons (2.65:1) is unchanged: it is the
  reference design the user chose.
- "New customer" on New Invoice and "New supplier" on New Purchase open in
  the same tab (user: "i dont want that" new tab). Saving goes straight back
  to the form with the new customer or supplier picked.

## 2026-10-03: Phase 4 (sales, invoices and customers)

- Decision: workers can enter the cash a customer pays when they make the
  invoice ("Record cash received, no balances"). Customer balances, the
  ledger, separate payments and voiding are admin-only. `post_sale` is
  security definer so it can write that one payment row for a worker;
  `customer_payments` is otherwise admin-only under RLS.
- Database: `record_customer_payment`, `void_customer_payment`,
  `customer_ledger` (running balance in SQL), `sale_list` view (paid,
  payment status, overdue), `sale_totals`, `customer_totals`. A payment
  cannot be linked to another customer's invoice or a void invoice.
  Voiding an invoice puts the stock back and voids its payments.
- Pages: Sales list (month cards, overdue pill with days late), New Invoice
  (finished products only, "only N in stock" warning, payment received),
  the printable invoice (company block from Settings, billed to, amount in
  words in lakh and crore, signature line, VOID stamp; Print / Save as PDF
  prints only the sheet), Customers list with balances, add and edit
  customer (with NTN), and the customer ledger with payments.
- `SupplierPaymentForm` became `PaymentForm` with `kind="supplier" |
  "customer"`; `PaymentsTable` takes the same `kind`.
- Purchases and Sales stat cards go four across only from 1536px: a
  seven-figure month total was clipped at 1440.
- Activity entries for invoices and customers now link to them.

## 2026-10-03: Phase 3 (production) and live search

- Search boxes now filter as you type (user: "when i start typing the search
  should start and update the list below"). 300ms after the last key the
  list updates; the URL is replaced, not pushed, so the back button is not
  filled with one entry per letter; focus stays in the box; the top loading
  bar shows while results load. Selects and dates still apply at once. The
  Apply button is gone; a Clear filters button appears when a filter is set.
  The header search works the same way and lands on Stock.
- Database: `production_list` view (product, unit, who entered it, materials,
  how many went over the recipe) and `production_totals` (quantities summed
  per unit, never across units). `post_production` refuses the same material
  twice. `void_production` explains in words when the finished goods have
  already been sold instead of a generic stock error.
- Pages: Production list with month cards, Record Production (materials
  filled in from the recipe and following the quantity made until edited,
  "over recipe" and "only N in stock" warnings, a "when you save" summary),
  and the run page with recipe vs actual per material and void.
- Stock history notes such as PRD-00011 now link to the run or purchase.

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
