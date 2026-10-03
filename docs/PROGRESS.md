# Progress

## Done

- [x] Phase 1: database (all phases' tables and posting functions), app shell,
      auth, Stock, Raw Materials, Products, Activity, Users, Settings, demo mode.
- [x] Phase 2: Purchases (list, new, detail, void) and Suppliers (list, add,
      edit, ledger with running balance, payments, void payment). Supplier
      money is admin-only.
- [x] Phase 3: Production (list, record run pre-filled from the recipe,
      run page with recipe vs actual, void). Search boxes filter as you type.
- [x] Phase 4: Sales and Customers (invoice list, new invoice, printable
      invoice with amount in words, customer list, add, edit, ledger,
      payments received, void). Workers can enter cash taken at the counter
      on a new invoice; other customer money is admin-only.

## Next

- [ ] Connect a Supabase project (ap-south-1), apply migrations 0001-0006,
      create the first admin, set the env vars on Vercel (region bom1).
- [ ] Phase 5: Dashboard charts and Reports (load the `dataviz` skill first).
- [ ] Phase 6: polish pass, docs.

## Reminders

- **Ask the client about importing existing records** (a register or Excel
  file with opening stock and customer/supplier balances). Deferred by the
  user on 2026-10-03: "Leave it for now, remind me in the future". Raise it
  again now that phase 4 is done (raised with the user on 2026-10-03). Until then, opening stock is entered on
  Stock > Opening stock / Adjust and opening balances on each customer and
  supplier.

## Open questions for the client (all configurable in Settings, none blocking)

- The remaining tape sizes (6 of about 10 to 12 are seeded).
- Recipes per product (materials per carton), entered in Settings > Recipes.
- Units and raw materials for stretch film and plastic strip (manufactured in house).
- Invoice details: NTN/STRN, GST on or off, terms.
