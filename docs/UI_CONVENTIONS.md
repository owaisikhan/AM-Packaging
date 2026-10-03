# UI conventions

The design language is copied from the reference the user chose,
invenza-html.vercel.app (Invenza). Only its look is copied, not its features.

## Tokens (app/_styles/globals.css)

| Token | Light | Dark | Use |
|---|---|---|---|
| primary | #22B573 | same | buttons, active nav, positive figures |
| primary-dark | #15945A | same | button hover |
| primary-light | #EAF8F1 | #0D2B1D | active nav pill, icon tiles |
| background | #F6F8FA | #0F172A | page |
| surface | #FFFFFF | #1E293B | cards, sidebar, header |
| border | #E8EDF1 | #334155 | every 1px line |
| text / heading | #17212B / #0F172A | #F1F5F9 | body / titles and figures |
| muted | #6B7280 | #94A3B8 | labels, captions |
| warning / danger / info | #F59E0B / #EF4444 / #3B82F6 | same | status |

Font: Inter (next/font). Radius 8/12/16/20. Shadows are soft and rare.

## Shell

- Sidebar 260px, fixed, white, section labels in small caps
  (MAIN, INVENTORY, TRADE, CRM, ANALYTICS, ADMIN), green-tint pill on the
  active page.
- **Burger button**: on 1024px and wider it collapses the sidebar to a 72px
  icon rail; each icon shows its name in a tooltip on hover or keyboard
  focus. The choice is saved in localStorage (`am_sidebar_collapsed`) and
  applied before first paint. Below 1024px the burger opens a drawer over a
  dimmed backdrop; tapping the backdrop or a link closes it.
- Header 64px: burger, item search, light/dark toggle, stock alert bell,
  account menu with sign out.
- Theme is a `.dark` class on `<html>`, saved as `am_theme`, applied before paint.

## Pages

- **List pages**: PageHeader card (breadcrumb, title, subtitle, actions on the
  right), a row of 4 StatCards, a FilterBar card, then a table card with
  uppercase grey headers and Pagination ("Showing 1-20 of N entries").
- **Below 1280px tables become cards** (one per row) so figures never scroll
  off screen; with the 260px sidebar open, laptop widths cannot fit a
  six-column money table. Stat cards go two per row on phones and stack their
  icon above the figure.
- **Payment status pills**: Paid (green), Partly paid (amber), Unpaid (red),
  Void (grey), each with an icon. Workers, who cannot see payments, get
  Recorded (blue) or Void instead.
- **Ledgers**: oldest first, Purchase (+) and Payment (-) columns, the
  running balance in the last column worked out by the database, an opening
  or brought-forward first line, and the closing balance in a footer bar.
  Balances read "Rs X to pay", "Rs X advance" or "Settled", never a bare
  negative number.
- **Voiding** uses `ReasonDialog`: it says what will happen in words, needs a
  reason, and the record stays visible marked void with that reason.
- **Form pages**: two columns; details on the left, a narrow right column with
  the summary/check card and a full-width green Save button.
- Filters are query strings (shareable). **Search filters as you type**
  (300ms pause, `router.replace` so history is not flooded, focus kept, top
  bar while loading). Selects and dates apply on change. No Apply button; a
  Clear filters button shows when any filter is set.
- **Text colour vs fill colour**: `text-primary-ink` and `text-danger-ink`
  for words and figures; `bg-primary` / `bg-danger` for fills. Never put
  `text-primary` or `text-danger` on text: the fills are too light to read
  as text on white.
- **Adding a missing record from inside a form** (New customer, New
  supplier): a same-tab link with `?from=invoice` or `?from=purchase`;
  saving returns to the form with the new record picked. No new tabs.
- **Printable documents** (the invoice): an `article.invoice-sheet` card
  holding the whole document; actions and admin-only panels sit outside it
  in `no-print` wrappers. `PrintButton` calls `window.print()`, and the print
  stylesheet hides the shell so only the sheet prints ("Save as PDF" is the
  browser's own). Amounts in words use lakh and crore. On phones the item
  table folds Qty and Rate into a line under the product name.
- **Recipe-filled forms**: rows filled from a recipe follow the quantity
  until the person edits them; show "Recipe: X", "In stock: Y", and warn
  in words ("1.5 over recipe", "Only 140 in stock") before saving.

## Charts (dashboard and Reports)

Built with the `dataviz` skill; components in `app/_components/charts/`.

- **Colours by job, from tokens in `globals.css`**, validated with the dataviz
  palette check against the card colour in both themes:
  - Series, always in this order: `--series-1` green, `--series-2` blue,
    `--series-3` amber (sales and revenue are green, purchases and cost
    blue, everywhere).
  - Ageing buckets: `--age-1..3`, one blue from light to dark.
  - Recipe difference: `--div-under` blue / `--div-over` red.
  - Stock status: `--status-good/warn/bad`, always with an icon and a word.
- **Never add quantities across units.** Cartons, rolls, bundles, kg and
  metres are shown one category or material at a time (pills or a picker).
  Anything summed across categories is in rupees.
- **One axis.** Revenue, cost and gross profit share one rupee axis; never
  a second y-axis.
- **Totals per day, week or month are columns**, not smooth lines: a curve
  between two days invents values that never happened.
- **Ranked lists and part-to-whole are HTML** (`RankBars`, `StackBar`): the
  name and figure in text, a thin bar under it. Long names wrap on phones
  and nothing needs a hover.
- Every chart card (`ChartFrame`) has a **Chart / Table** toggle with the
  same figures, a legend for two or more series, an empty-state sentence,
  and text in text colours (never the series colour).
- Bars at most 24px, 4px rounded tops; lines 2px; hairline solid grid.
- Axis money is short and local ("Rs 4.6 lakh", `formatCompactMoney`);
  tooltips and tables show whole rupees.
- Reports: tabs as links, one filter row (period presets, dates, group by)
  above everything it scopes; the CSV download is built from the same
  tables as the page (`app/_lib/reports.js`).

## Rules that do not bend

- Money and quantities use `.num` (no wrap, tabular figures) and always carry
  their unit ("412.5 kg", "Rs 4,800").
- Status pills always contain a word and an icon, never colour alone:
  In Stock (green), Low Stock (amber), Out of Stock (red).
- Form text is 16px (stops iOS zooming), placeholders start with "e.g." and
  are lighter than typed text.
- Every pending submit button disables itself and says what it is doing.
- Destructive actions confirm in words; ledger entries are voided, not deleted.
