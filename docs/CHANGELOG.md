# Changelog

## 2026-10-04: Adding a user no longer crashes the page

- With `SUPABASE_SERVICE_ROLE_KEY` missing on the server, **Add user** threw
  "supabaseKey is required." and showed the error page. Now the form says
  the setting is missing and where to add it; other sign-in service errors
  also show as a message.

## 2026-10-04: Per-worker permissions

- When adding a worker, or later with **Edit**, an admin ticks what that
  worker can do: see stock, record purchases, record production, make
  invoices, take cash on invoices, add customers, add suppliers, and, off by
  default, see balances and payments, record payments, see reports and
  cancel entries (void).
- Enforced in the database by migration `0008_permissions.sql`
  (`profiles.permissions`, `has_perm`, `require_perm`; posting, payment,
  void, ledger and report functions check them; payment and insert policies
  use them). Voids and payments run as security-definer functions, so a
  permitted worker can cancel or pay but never edit amounts directly.
- The menu, pages, dashboard money cards, report tabs and buttons follow the
  same permissions. Existing workers keep exactly what they had.
- Rule tests: Phase 8 covers a production-only worker and a trusted worker.

## 2026-10-04: Clearer side menu in dark mode

- Menu words and icons are brighter (#cbd5e1), the current page is a clear
  green row instead of a near-invisible tint, hover is visible, and the
  section headings are 11px (were 10px) in both themes.

## 2026-10-04: Guide in Urdu

- An **اردو / English** button at the top right of the Guide switches the
  whole page to Urdu, written right to left in Noto Nastaliq Urdu (loaded
  on the Guide page only). Button and field names stay in English, in bold,
  so they match the screens. The choice is remembered in a cookie, so the
  Guide opens in the same language from the menu next time.
- Urdu words live in `app/_lib/guide-content-ur.js`, matched to the English
  sections by id; a missing section falls back to English.

## 2026-10-04: Guide page

- New **Guide** page (`/admin/guide`, in the menu under Dashboard) for
  everyone: a daily checklist, then numbered steps for checking stock,
  purchases, production, invoices, adding customers and suppliers, and what
  to do after a mistake, each with a button to the real page. Admins also
  see first-time setup in order, payments, voiding, stock corrections,
  users, reports and activity. Ends with "If something goes wrong".
- The wording lives in `app/_lib/guide-content.js`, using the exact button
  and field labels on screen in bold.
- Live database: migrations 0001 to 0007 applied to the Supabase project
  (Singapore) and checked against the local test run; first admin added.

## 2026-10-04: Phase 6 (polish pass)

- Regression checks: `npm run check` (`scripts/checks/`, Playwright) walks
  42 pages in light and dark at phone, laptop and desktop widths: pages
  render with a clean console, nothing past a phone's edge, no figure
  clipped or spilling, no table scrolling sideways at 1024 to 1440, AA
  contrast, readable dark-mode dropdowns, charts drawn with one-line axis
  labels, 44px touch targets, search as you type, invoice printing, no new
  tabs. Each check was proven by putting its bug back and watching it fail.
- Bugs the checks and the audit found and fixed:
  - Stock item history (phase 1) still switched to cards at 768px: its
    table scrolled sideways by up to 434px at laptop widths.
  - Users page and Settings lists ran off the side of a phone; Settings
    and Reports tabs scrolled out of sight. They now stack or wrap.
  - The closed phone menu was only moved off screen, so Tab and screen
    readers still reached it. It is now hidden as well.
  - No favicon: every tab logged a 404. Added the app icon (green tile,
    package glyph) and an Apple touch icon.
  - A sample activity entry linked a run that does not exist (`r11`).
  - A refactor during this phase lost a name in `reports.js`; lint and
    build passed and the Reports page showed its error screen. `no-undef`
    is now on in `eslint.config.mjs`, so this fails at lint.
  - Stat and KPI figures and the invoice did not fit a 320px phone.
- Touch: buttons are 44px; compact controls grow to 44px on touch screens
  (`pointer-coarse:`); small text links get a touch area (`tap-inline`).
- Waiting and errors: loading screens with the real titles and column
  headings (`ui/PageSkeletons.js`); list pages keep theirs inside a
  `(list)` route group so detail and form pages do not flash a list;
  `app/admin/error.js` and not-found pages in plain words.
- Server messages pass through `withoutDashes` before they reach the screen.

## 2026-10-04: Phase 5 (dashboard charts and reports)

- Database (`0007_reports.sql`): `item_costs` view (raw: average purchase
  rate; product: average material cost per unit over its runs), and report
  functions for sales and purchases per period, top customers, suppliers
  and products, production per category, material use against the recipe,
  stock value and stock in/out, ageing of balances (payments clear the
  oldest bills first; opening balances count as over 60 days) and gross
  profit. Money reports are admin-only; production figures are for all
  staff. Quiet days come back as zero rows. Tests cover the figures and
  the role checks.
- Dashboard: KPI cards for today (sales, purchases, production runs, money
  to receive; workers see production and stock), Sales vs Purchases with
  Daily / Weekly / Monthly pills, a This month card, Production output per
  category, a Stock health donut, Top 5 products and stock alerts with
  meters against the low-stock level. Workers see no money.
- Reports page: seven tabs, a period filter (presets or dates, group by
  day, week or month), stat cards, charts with a Table view, and a CSV
  download of the same tables.
- Deviations from the plan, because units differ (ctn, roll, bdl, kg, m):
  production is charted per category, material use one material at a time,
  and stock by category in rupees as bars (eight categories is too many for
  a donut). The dashboard donut shows stock health (in, low, out) instead.
- Demo data: the tape recipes used 3,950 m of jumbo roll per carton, which
  made a carton cost more than it sells for. Now 290 to 300 m, matching a
  1,270 mm jumbo slit into 46 mm strips.
- `DEMO_ROLE=worker` shows the demo as a worker sees it.
- Removed the unused `ComingSoon` placeholder.

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
