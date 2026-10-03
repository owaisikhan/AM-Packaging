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
- **Production** (phase 3) pre-fills the materials used from each product's
  recipe; the worker corrects them before saving.
- **Purchases and sales** (phases 2 and 4) save the bill, its lines, the stock
  movement and any payment together, with supplier and customer balances.
- **Activity** records every create, update, delete, void, payment, stock
  entry and sign-in, by Postgres triggers, filterable by who did it.
- **Settings** hold the company and invoice details and every list the client
  maintains: categories, brands, sizes, microns, colours, units and recipes.

## Roles

| | Admin (2) | Worker (3) |
|---|---|---|
| See stock, items | Yes | Yes |
| Record production, purchases, sales, payments | Yes | Yes |
| Add customers and suppliers | Yes | Yes |
| Add or edit items, recipes, settings, users | Yes | No |
| Opening stock and adjustments | Yes | No |
| Void a bill or run, edit past entries | Yes | No |
| Reports, activity log, rates and profit | Yes | No |

## Stack

Next.js 16 (App Router, plain JavaScript), Tailwind v4, Supabase (Postgres,
RLS, password sign-in), Vercel. Deploy region `bom1` beside Supabase
`ap-south-1`.

## Running it

```bash
npm install
npm run dev          # with no .env.local: demo mode on sample data
```

To connect a database:

1. Create a Supabase project (region ap-south-1, Mumbai).
2. Run `supabase/migrations/0001` to `0006` in order (SQL editor or `supabase db push`).
3. Copy `.env.example` to `.env.local` and fill in the URL, anon key and service-role key.
4. Create the first admin: add a user in Supabase Auth, then
   `insert into profiles (id, full_name, role) values ('<auth user id>', 'Ahmed Munir', 'admin');`
   That admin adds everyone else from the Users page.

Database rule tests (local Postgres only): `bash supabase/tests/run.sh`.
