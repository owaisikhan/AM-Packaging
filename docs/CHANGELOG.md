# Changelog

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
