@AGENTS.md

# AM Packaging: working in this repo

Inventory, production, purchase and sales app for **Ahmed Munir Packaging
Industry** (packaging tape manufacturer, Faisalabad). The full plan, including
the client's voice-note requirements, is in `docs/PLAN.md`. What is built and
what is next is in `docs/PROGRESS.md`.

Built with the kodexa-builder skill (v1.5.0). Load it for any new feature or
design work, and log preferences, corrections and reversals to
`.claude/kodexa-learnings.md` as they happen.

## Who uses it

5 people: 2 admins (owner side) and 3 workers (factory floor). Mixed ages,
English UI, phones and a desktop. Design for the less screen-confident
reader: full-word labels beside icons, 16px form text, 44px tap targets,
money and quantities never wrap, colour never the only signal.

Palette exceptions: Inter as the only typeface (one exception: Noto Nastaliq Urdu for the Urdu Guide, loaded on that page only), green #22B573 primary and the
green gradient dashboard banner. All come from the reference design the user
chose (invenza-html.vercel.app); do not "fix" them. Text in green or red uses
`text-primary-ink` / `text-danger-ink` (the fills are too faint as text).

## Ground rules

- **No em dashes or en dashes anywhere** (UI copy, errors, seed data,
  comments, docs). Use a comma, colon, full stop, brackets or a plain hyphen.
  Check: `LC_ALL=C.UTF-8 grep -rnP '\x{2014}|\x{2013}' app/ supabase/ docs/ CLAUDE.md README.md`
  (exit code 1 with no output means clean; AGENTS.md is written by Next and is exempt).
- **Every read in `app/_lib/data-service.js`, every write in `app/_lib/actions.js`.**
  Actions return `{ ok, message, ...extras }`, rendered by `<FormMessage>`.
- **Rules that protect stock and money live in Postgres** (`supabase/migrations/`):
  the stock guard, posting functions (`post_purchase`, `post_sale`,
  `post_production`), voiding, gapless document numbers, RLS, and the
  activity log triggers. App checks are a courtesy.
- **Database error messages are sentences for the owner**, naming the item
  and figures and saying what to do next.
- **Migrations are append-only.** Never edit one that has been applied to the
  live project; add a new numbered file. 0001 to 0007 were applied to the
  live project (ref fqvmljwlwfjensumiqws, Singapore) on 2026-10-04, so the
  next change is 0008.
- **Nothing is deleted from the ledger.** Purchases, sales and production
  runs are voided (admin, with a reason), which writes reversing stock entries.
- **Supplier money is admin-only** (balances, ledger, payments, voiding).
  Workers record purchases without a payment.
- **Customer money is admin-only too**, with one exception: a worker can
  enter the cash received when making an invoice (through security-definer
  `post_sale`). Workers never see balances, ledgers or what an invoice has
  had paid against it.
- **Workers vs admins:** RLS is the real fence, `requirePageRole` /
  `requireRole` in pages and actions the second, hidden nav links cosmetic.
- **Demo mode:** with no Supabase env vars the app runs on
  `app/_lib/demo-data.js` and saving is off. Keep demo rows shaped exactly like
  the real query rows. `DEMO_ROLE=worker` shows it as a worker.
- Design language follows the reference site exactly: tokens and component
  classes in `app/_styles/globals.css`. Do not add features from the
  reference that the client did not ask for.

## Shared pieces to reach for first

- Layout: `PageHeader`, `Sidebar` (collapse state in `sidebarState.js`), `Header`, `NavigationProgress` (PMC loading bar).
- UI: `StatCard`, `Badge`, `FilterBar` (filters as query strings), `Pagination`, `EmptyState`, `FormMessage`, `SubmitButton`, `MoneyRow`, `ReasonDialog` (void with a reason; pass icons as elements, not components).
- Admin: `ItemsTable` / `ItemsListPage` (Stock, Raw Materials, Products), `StockStatus`, `MovementType`, `ActivityTable`, `LookupManager` (Settings lists), `PurchasesTable`, `PurchaseForm`, `PaymentStatus`, `PaymentForm` and `PaymentsTable` (both take `kind="supplier" | "customer"`), `ProductionForm`, `RunStatus`, `SaleForm`, `SalesTable` (with `OverduePill`), `CustomerForm`, `SupplierForm`.
- Print: `PrintButton` and the `.invoice-sheet` / `no-print` classes.
- Charts (`app/_components/charts/`): `ChartFrame` (card with Chart / Table toggle), `ColumnChart`, `TrendChart`, `DonutChart`, `RankBars`, `StackBar`; shape rows with `periodView` in `app/_lib/chart-data.js`. Load the `dataviz` skill before adding a chart. Never sum quantities across units.
- Guide: `/admin/guide` reads its words from `app/_lib/guide-content.js`. When a button or field label changes on screen, change it there too, and in the Urdu copy `guide-content-ur.js` (same section ids; the on-screen names stay English inside the Urdu).
- Reports: `app/_lib/reports.js` builds each tab for both the page and the CSV; `demo-reports.js` mirrors `0007_reports.sql` for demo mode.
- Formatting: `format-helpers.js` (money as "Rs 1,250", `amountInWords` in lakh/crore, `withoutDashes` for server messages), `date-helpers.js` (Asia/Karachi).
- Waiting and touch: `ui/PageSkeletons.js` for `loading.js` files (list pages keep theirs in a `(list)` route group), `tap-inline` for small text links, `pointer-coarse:min-h-[44px]` for compact controls.

## Verifying a change

1. `npx eslint .` (includes `no-undef`) and `npm run build`.
2. Database: `bash supabase/tests/run.sh` applies every migration to a local
   throwaway Postgres and runs the rule tests as an admin and a worker. Each
   "expect" line in `supabase/tests/rules_test.sql` says what should happen.
   Never run it against the live project.
3. Screens: `npm run build && npm start` with no env (demo mode), then
   `npm run check` (about two minutes, all must pass). Add a check to
   `scripts/checks/` for every bug that passed the build, and a new page to
   `scripts/checks/pages.mjs`. Then look at the changed screens at 1440, 1024,
   390 and 360 wide: tables switch to cards below 1280px.
