# AM Packaging

Stock, production, purchases and sales for **Ahmed Munir Packaging Industry**,
265-D Small Industrial Estate, Sargodha Road, Faisalabad.

## What it does

- **Raw materials** (jumbo rolls by micron, paper tubes and cartons by brand,
  shrink film, and any category the client adds) and **products** (tape
  cartons by size, micron and colour, stretch film, plastic strip, and more
  later) live in one items list.
- **Stock** is never typed in directly. It is the sum of a ledger:
  opening stock, purchases, production (finished goods in, raw materials
  out), sales and admin adjustments with a reason. Stock cannot go below zero.
- **Production** pre-fills the materials used from each product's recipe;
  the worker corrects them before saving.
- **Purchases and sales** save the bill or invoice, its lines, the stock
  movement and any payment together, with supplier and customer ledgers. An
  invoice prints (or saves as PDF) on its own, with the amount in words.
- **Dashboard and Reports** chart sales, purchases, production, raw material
  use against the recipe, stock value, money owed (with ageing) and gross
  profit. Every chart has a table view, and each report downloads as CSV.
- **Activity** records every create, update, delete, void, payment, stock
  entry and sign-in, by Postgres triggers, filterable by who did it.
- **Settings** hold the company and invoice details and every list the client
  maintains: categories, brands, sizes, microns, colours, units and recipes.

## Roles

| | Admin (2) | Worker (3) |
|---|---|---|
| See stock and items | Yes | Yes |
| Record production, purchases and sales | Yes | Yes |
| Take cash from a customer on a new invoice | Yes | Yes |
| Add customers and suppliers | Yes | Yes |
| Balances, ledgers, other payments (customers and suppliers) | Yes | No |
| Add or edit items, recipes, settings, users | Yes | No |
| Opening stock and adjustments | Yes | No |
| Void a purchase, invoice, run or payment | Yes | No |
| Reports, activity log, rates and profit | Yes | No |

## Stack

Next.js 16 (App Router, plain JavaScript), Tailwind v4, Supabase (Postgres,
RLS, password sign-in), Vercel. The live Supabase project is in Singapore
(`ap-southeast-1`), so set the Vercel function region to `sin1`.

## Running it

```bash
npm install
npm run dev          # with no .env.local: demo mode on sample data
DEMO_ROLE=worker npm run dev   # the demo as a worker sees it
```

To connect a database:

1. Create a Supabase project (the live one is in Singapore, ap-southeast-1).
2. Run `supabase/migrations/0001` to `0007` in order (SQL editor or `supabase db push`).
3. Copy `.env.example` to `.env.local` and fill in the URL, anon key and service-role key.
4. Create the first admin: add a user in Supabase Auth, then
   `insert into profiles (id, full_name, role) values ('<auth user id>', 'Ahmed Munir', 'admin');`
   That admin adds everyone else from the Users page.

## Checking a change

```bash
npx eslint .                      # includes no-undef: a lost name fails here, not at runtime
npm run build
bash supabase/tests/run.sh        # database rules, local throwaway Postgres only
npm run build && npm start        # demo mode (no .env.local), then in another terminal:
npm run check                     # the regression checks in scripts/checks
npm run check -- --base http://localhost:3100 --only contrast,taps
```

`npm run check` drives the app in Playwright: every page renders with a
clean console, nothing runs past a phone screen (320 to 414px), no figure is
clipped or spills from its card, no table scrolls sideways at 1024 to
1440px, text meets AA contrast in light and dark, dark-mode dropdowns are
readable, charts draw, touch targets are 44px, search filters as you type,
an invoice prints on its own, and no link opens a new tab. Each check exists
because that bug happened once. Run it against a demo build only: demo mode
cannot save anything.
