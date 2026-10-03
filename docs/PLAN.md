# AM Packaging: Inventory, Production, Sales & Purchase App (plan)

## Context
Client: **Ahmed Munir Packaging Industry (AM Packaging)**, 265-D Small Industrial Estate, Sargodha Road, Faisalabad. Tagline "Your Trusted Packaging Partner". They manufacture packaging tape (clear, brown, colored, printed and kraft tapes in the flyer). Brand colors: deep blue, bright sky blue and white.

They want one app for **5 users (2 admins, 3 workers)** to record raw materials, products, manufacturing, stock, purchases and sales. The repo is empty, so this is a new build.

### What the voice notes say (transcribed from Urdu)
- **Note 1, raw material.** There are 4 types: **paper tube** (core), **carton** (box), **shrink film** and **jumbo roll** (the big BOPP roll that is slit into tape). Paper tubes come in 4 to 5 brands and boxes in 4 to 5 brands. Jumbo rolls are identified by **micron**.
- **Note 2, finished goods.** **Tape cartons**, **stretch film** and **plastic strip**. "Leave the option open" so they can **add more product types later** without a developer.
- **Note 3, stock and sizes.** Tape sizes include **24mm x 72yd, 69mm x 72yd, 72mm x 72yd, 46mm x 72yd, 46mm x 70yd and 60mm x 72yd**. There are about **10 to 12 sizes in total, each also varying by micron**.
  - Admins can add sizes themselves (width mm x length yd), so the rest of the list can be entered later.
  - The six sizes above are seeded on day one.

## Decisions confirmed
- **Production uses an editable recipe.** Each product has a set recipe and the app pre-fills the raw materials used. The worker corrects them before saving.
- **Online.** Supabase and Vercel, usable from any phone or laptop.
- **Full money tracking.** Bills, payments, customer and supplier balances, and a profit report.
- **Users are mixed ages, English UI.** The visual design follows the reference site (see the UI design section). Full-word labels sit beside every icon, form inputs use 16px text, and money and quantities never wrap.

## Stack (house default)
- Next.js 16 App Router in plain JS, Tailwind v4, Supabase (Postgres, RLS, password Auth) and Server Actions.
- Hosted on Vercel in `bom1`, with Supabase in `ap-south-1`.
- saam-s-store folder layout. `data-service.js` holds every read and `actions.js` every write.
- **The stock rule lives in Postgres.** One `stock_movements` ledger records every in and out. Purchases, production and sales post through atomic RPCs. Negative stock is refused with a plain-English message.

## UI design: follow the reference exactly (Invenza, invenza-html.vercel.app)
This is the design language only. **No features are taken from the reference** (no Expenses, warehouses and so on); the pages stay as listed below. I studied 5 of its pages (dashboard, products, add purchase, sales, invoice) and its CSS tokens.
- **Tokens** (copied into `@theme` in `globals.css`):
  - Primary `#22B573`, primary-dark `#15945A`, primary-light `#EAF8F1`.
  - Background `#F6F8FA`, surface `#FFF`, border `#E8EDF1`, text `#17212B`, muted `#6B7280`.
  - Warning `#F59E0B`, danger `#EF4444`, info `#3B82F6`.
  - Radius 8/12/16/20, soft shadows (`0 1px 4px rgba(0,0,0,.06)`), font **Inter** 300-800.
  - A dark theme with the reference's dark tokens, and the moon toggle in the header.
- **Shell:**
  - Fixed white **sidebar** 260px (collapses to 72px), logo tile and name at the top, user card at the bottom.
  - Small-caps section labels (MAIN / INVENTORY / CRM / ANALYTICS / ADMIN), and a green-tint pill on the active item.
  - A 64px **header** with the menu toggle, a global search pill, the dark-mode toggle, a bell (low-stock alerts) and a user menu.
  - Copyright footer.
- **Sidebar collapse** (the burger button in the header, matching the reference's `app.js`):
  - **Desktop and laptop (1024px and wider):** clicking the burger collapses the sidebar to a **72px icon-only rail**.
    - Labels, section headings and expand chevrons fade out, and icons are centered. The logo shrinks to its icon tile, and the user card shows only the avatar.
    - The main content's left margin slides from 260px to 72px over 0.3s (`cubic-bezier(.4,0,.2,1)`).
    - Clicking the burger again expands the sidebar.
    - The state is saved in `localStorage` (inside a try/catch), so it survives reloads. It is applied before first paint to avoid a flash.
    - When collapsed, each icon shows its page name as a **tooltip on hover or focus**, so nothing becomes unlabelled.
  - **Tablet and phone (under 1024px):** the burger opens the sidebar as a full-width-label **off-canvas drawer** over a dimmed overlay instead. Tapping the overlay or a link closes it. The cards stack in a single column.
- **Our sidebar** follows the same groups:
  - MAIN: Dashboard.
  - INVENTORY: Stock, Raw Materials, Products, Production.
  - TRADE: Purchases, Sales/Invoices.
  - CRM: Customers, Suppliers.
  - ANALYTICS: Reports.
  - ADMIN: Activity, Users, Settings.
- **Dashboard:**
  - A green gradient welcome banner ("Welcome back, {name}", "N items running low on stock") with date-range buttons.
  - 4 KPI cards with a tinted icon tile, a big figure, an uppercase label and a colored progress bar: Today's Production, Sales, Purchases, and Receivable (admin only).
  - A sales statistics line chart (Recharts, green area) and a breakdown card (sales / purchases / receivable / payable).
- **List pages** (Stock, Products, Raw Materials, Purchases, Sales, Customers, Suppliers):
  - A page-header card with breadcrumb, H1, subtitle and right-aligned actions (green primary button, outlined secondary).
  - 4 count cards (for example Total / In Stock / Low Stock / Out of Stock).
  - A filter card (search plus selects), and a table card with uppercase grey headers, roomy rows, **status pills** (In Stock green, Low Stock amber, Out of Stock red, always with text), and pagination ("Showing 1-10 of N").
- **Form pages** (New Purchase, New Sale, Production run):
  - Two columns: info and **line-items cards** on the left ("Add Item Row" and a red delete button per row).
  - On the right, a **calculation card** (subtotal, discount, GST, green **Grand Total**), then a **Payment Details** card (status, amount paid, method) and a full-width green Save button.
  - The Production page uses the same layout with the recipe materials as line items.
- **Invoice page:**
  - Page-header actions Back / Print / PDF.
  - The invoice sheet has the AM logo and company block (from Settings), Billed To, a grey meta box (number, dates, payment method), an items table, a totals block with a green Grand Total and a tinted "Amount Paid" bar, terms, and a signature line.
  - A print stylesheet hides the shell.
- Icons are lucide-react (the reference uses the same line-icon style).
- **Readability guarantees on top of the reference:** money and quantities never wrap, status is never shown by color alone, and tap targets are at least 44px.
- **House-rule exceptions** (the user chose these): Inter and the green gradient banner. These are recorded in `CLAUDE.md` as `Palette exceptions:` so the slop scan doesn't flag them.

## Data model (core tables)
- **Setup tables:** `item_categories` (Paper Tube, Carton, Shrink Film, Jumbo Roll, Tape Carton, Stretch Film, Plastic Strip, and any the client adds later), `brands`, `sizes` (width mm x length yd), `units`.
- **items:** a single table for raw materials and finished goods, using a `kind` of raw or finished. Attributes are brand, size, micron, color/type, rolls per carton, unit and a low-stock level.
  - Example finished item: "Tape 48mm x 72yd, 40 micron, Clear, 72 rolls/carton".
- **stock_movements:** item, quantity (+/-), type (purchase, production_in, production_use, sale, adjustment, opening), reference and user. Current stock is a view that sums this table.
- **Purchases:** `suppliers`, `purchases` and `purchase_lines`, plus `supplier_payments`.
- **Sales:** `customers`, `sales` (invoice no., date) and `sale_lines`, plus `customer_payments`.
- **Production:** `production_runs` (date, finished item, cartons made, worker) and `production_consumption` (raw items used). Each finished item can have a recipe (`recipes` / `recipe_lines`, quantity per 1 unit made), which pre-fills the consumption.
- **profiles:** name and role (admin or worker).
- **activity_log:** id, created_at, user_id (actor), action (created/updated/deleted/login/logout/adjusted/payment), module (purchase, sale, production, stock, item, customer, supplier, payment, settings, user), record_id, a human summary ("Ali created Sale INV-0042 for Rs 125,000"), and `changes` jsonb with the before and after values.
  - Written by **Postgres triggers** on every business table, plus the login and logout actions, so no write can skip the log.
  - **Append-only:** RLS lets admins select. No one can update or delete, and there is no insert policy (only the triggers write).
- **settings:** a single row of company and invoice settings. `microns` and `colors` are lookup tables. Customers and suppliers have an `opening_balance` field.

## Pages (one folder per nav section under `app/admin/`)
1. **Login.** Password only. Admins create the 5 users, with no self signup.
2. **Dashboard.** Today's production, sales and purchases, a low-stock list, and money owed to us and by us (admin only). Charts:
   - **Sales vs Purchases**: area or line chart by month, with Daily / Weekly / Monthly toggle pills as in the reference.
   - **Production output**: bar chart of cartons made per day over the last 30 days.
   - **Stock by category**: donut, raw vs finished, in units.
   - **Top 5 products sold**: horizontal bar.
   - **Low-stock items**: a list with mini progress bars (stock vs low-stock level).
   - Workers see only Production output and Stock by category. Money charts are admin only.
3. **Stock.** Current stock of every item, filterable by raw/finished, category, brand, size and micron. Opening a row shows that item's movement history. Admins can make an **adjustment** (with a mandatory reason) and enter **opening stock**.
4. **Raw Materials.** List, add and edit paper tubes (brand), cartons (brand and size), shrink film and jumbo rolls (micron, width, length and color).
5. **Products.** List, add and edit finished goods: tape cartons (size x micron x color, rolls per carton), stretch film and plastic strip. **Admins can add new product categories** here, which covers the "leave the option open" request.
6. **Production.** Record a manufacturing run (date, product, cartons made). The raw materials used are pre-filled from the recipe and can be edited. Saving adds finished stock and deducts raw stock in one transaction.
7. **Purchases.** New purchase (supplier, date, lines, rates), the purchase list and a detail page. Raw stock goes up when the purchase is saved.
8. **Suppliers.** List and add suppliers. Each supplier has a ledger page showing purchases, payments and balance.
9. **Sales.** New sale or invoice (customer, lines, rates), the list, and a **printable invoice** with AM branding. Finished stock goes down when the sale is saved.
10. **Customers.** List and add customers. Each customer has a ledger page showing sales, payments received and outstanding balance (udhaar).
11. **Reports (admin).** One tab per report, a date-range filter, a chart on top, and the table below with CSV export.
   - **Sales:** revenue by day or month (bar) and by customer (top 10 horizontal bar).
   - **Purchases:** spend by month (bar) and by supplier (horizontal bar).
   - **Production:** cartons per product over time (stacked bar by product category: tape, stretch film, plastic strip).
   - **Raw material consumption:** used per material over time (line), plus the recipe vs actual difference per run (bar).
   - **Stock:** current value by category (donut) and movement in vs out per month (grouped bar).
   - **Receivables & Payables:** customer and supplier balances (horizontal bar) and an ageing breakdown (0-30, 31-60, 60+ days, stacked bar).
   - **Profit:** revenue, cost and gross profit by month (combined bar and line).
12. **Users & Settings (admin).** See the Settings tabs below.
13. **Activity (admin).** Every action performed in the app, newest first, in the reference's list-page style.
    - **Count cards:** Today's actions, Creates, Updates, Deletes.
    - **Filter card:**
      - **User** (who performed it; the main filter, defaulting to All users).
      - Module, action type, date range, and a text search over the summary.
    - **Table:** time, user (avatar and name), action pill (Created green, Updated blue, Deleted red, each with text), module, summary with a link to the record, and a "View changes" button.
      - The button opens a dialog with a before/after table of the changed fields.
    - Paginated and exportable to CSV.
    - Each user's row on the Users page links here, pre-filtered to that user.

### Role split (default, to confirm)
- **Admin:** everything, including prices, ledgers, reports, adjustments, users and deleting entries.
- **Worker:** record production, view stock, and enter purchases and sales. Workers do not see profit, cannot edit or delete past entries, and cannot reach users or settings.

## Build phases
1. Scaffold, auth and roles, the activity_log table and triggers, setup tables, items and opening stock, the Stock page, and the Activity page.
2. Purchases and suppliers, then supplier ledger and payments.
3. Production with recipes (tape, stretch film and plastic strip).
4. Sales and customers, printable invoice, customer ledger and payments.
5. Dashboard and reports with charts (Recharts). Load the `dataviz` skill before the first chart.
   - Series colors come from the reference tokens: green `#22B573`, blue `#3B82F6`, amber `#F59E0B`, red `#EF4444`.
   - Every chart has a title, axis labels, tooltips with formatted Rs values, a legend whenever there is more than one series, and an empty state for periods with no data.
6. Docs (`CLAUDE.md`, `docs/UI_CONVENTIONS.md`, `docs/CHANGELOG.md`), `.claude/kodexa-learnings.md`, and a polish pass using the anti-slop gate.

## Client answers (resolved): everything is configurable in Settings
1. **Sizes.** The client adds the remaining sizes in **Settings > Sizes**. The 6 known sizes are seeded.
2. **Microns, colors/types and rolls per carton.** The client enters these in **Settings** (microns, colors/types) and on each product (rolls per carton).
3. **Units.** Created in **Settings > Units** (kg, pcs, roll, meter, and so on). When adding a raw material, the user picks a unit or creates a new one on the spot.
4. **Material used per carton.** The client builds each product's recipe in **Settings > Recipes**. If a product has no recipe, the production form starts empty and the worker enters the materials by hand.
5. **Stretch film and plastic strip are manufactured.** They get recipes and production runs like tape. Their raw materials (for example granules) are added by the client as new raw material categories.
6. **Invoice and bill.** There is no existing format. Invoice settings go in **Settings > Invoice**:
   - Company name, address and phone.
   - Logo.
   - NTN/STRN, a GST on/off switch with its rate, invoice number prefix, and footer text.
   - The printable invoice reads all of these.
7. **Existing records and opening balances: deferred.** The Stock page has an opening-stock entry, and customers and suppliers get an opening-balance field, so they can be entered by hand.
   - REMINDER: ask the client about importing a register or Excel file. Logged in `docs/PROGRESS.md` and raised again at the end of phase 4.
8. **Users.** Admins create users with names, passwords and roles in **Users**. The first admin account is created at setup.

## Settings page (admin only), tabs
Company & Invoice | Categories (raw/finished) | Brands | Sizes | Microns | Colors/Types | Units | Recipes | Users
(Activity is its own sidebar page, not a Settings tab.)

## Verification
- `npm run build`, `npx eslint .`, and the slop scan.
- DB rules tested with roll-back blocks: negative stock is refused, and production deducts stock per the recipe.
- A Playwright render check at 1440/1024/400/360 using realistic fixture data (seven-figure sums, long names).
- Activity log: every create, update and delete in the end-to-end run appears with the right user. Filtering by user shows only that user's rows, and a worker can't open the Activity page or read `activity_log`.
- An end-to-end run as admin and as worker: purchase, then production, then sale, then payment. Check that stock and ledger balances match a hand calculation.
