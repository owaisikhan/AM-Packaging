# kodexa-builder learnings

This file is how this repo teaches the kodexa-builder skill. Every session
that loads the skill reads it first and appends to it as the user corrects,
reverses or chooses things. Entries promoted into the skill are marked with
the version they landed in. See the skill's `references/self-improvement.md`
for the rules.

- **Project:** AM Packaging (Ahmed Munir Packaging Industry), inventory and manufacturing app
- **Type:** dashboard
- **Who reads it daily:** 2 admins and 3 factory workers, mixed ages, phones and a desktop
- **Palette exceptions:** Inter only, green #22B573 primary and green gradient banner (copied from the reference design the user chose)
- **Skill version when started:** 1.4.0

## Summary

| ID | Date | Kind | Lesson (short) | Scope | Status |
|---|---|---|---|---|---|
| L-001 | 2026-10-03 | choice | Given a reference site, copy its design language exactly, palette included, and none of its features | type: dashboard | promoted v1.5.0 |
| L-002 | 2026-10-03 | rule | Dashboard sidebar collapses to an icon rail from the burger, with tooltips | type: dashboard | promoted v1.5.0 |
| L-003 | 2026-10-03 | gap | Multi-user business apps get an admin Activity log filterable by user | type: dashboard | promoted v1.5.0 |
| L-004 | 2026-10-03 | rule | Plan charts on the dashboard and reports from the start | type: dashboard | logged |
| L-005 | 2026-10-03 | rule | Business lists the client "will decide" go in Settings, not in questions | type: dashboard | promoted v1.5.0 |
| L-006 | 2026-10-03 | gotcha | Playwright in cloud sessions cannot open external sites; mirror with wget | all | promoted v1.5.0 |
| L-007 | 2026-10-03 | gotcha | Urdu voice notes: Whisper transcript is good, numbers in the translation are not | all | promoted v1.5.0 |
| L-008 | 2026-10-03 | choice | Supplier money (balances, ledger, payments) admin-only; workers record bills | project | project |
| L-009 | 2026-10-03 | gotcha | Card/table switch at 768px is too low with a 260px sidebar; use 1280px | type: dashboard | promoted v1.5.0 |
| L-010 | 2026-10-03 | gotcha | Never pass an icon component into a client component; pass an element | all | covered |
| L-011 | 2026-10-03 | correction | Search boxes filter as you type, not on Enter or an Apply button | all | promoted v1.5.0 |
| L-012 | 2026-10-03 | choice | Workers may take cash at the counter on a sale; all other customer money admin-only | project | project |
| L-014 | 2026-10-03 | correction | "Add new X" links inside a form open in the same tab and return with X picked | all | promoted v1.5.0 |
| L-015 | 2026-10-03 | gotcha | Dark mode: native select options need a solid background; translucent select fill does not reach them | all | promoted v1.5.0 |
| L-016 | 2026-10-03 | gap | Run a measured contrast audit in both themes; brand fills often fail as text | all | promoted v1.5.0 |
| L-017 | 2026-10-04 | gotcha | Multi-unit inventories: never sum quantities across units in a chart; per category or in money | type: dashboard | logged |
| L-018 | 2026-10-04 | gotcha | Period totals are columns; smooth area lines between sparse daily totals invent values | all | logged |
| L-019 | 2026-10-04 | gap | Build a profit report early: it exposed demo recipe data that made goods cost more than they sell for | type: dashboard | logged |
| L-020 | 2026-10-04 | stale | slop_scan misses phrase exceptions and calls a .dark class "dark-only" | all | promoted v1.5.0 |
| L-021 | 2026-10-04 | gotcha | Plain-JS Next repos need no-undef: a lost name built cleanly and broke a page | all | promoted v1.5.0 |
| L-022 | 2026-10-04 | stale | dashboard.md says npm run check = lint + build; SKILL.md says scripts/checks | type: dashboard | promoted v1.5.0 |
| L-023 | 2026-10-04 | repeat | Older pages drift from later layout rules; dashboard checks must walk every page | type: dashboard | promoted v1.5.0 |
| L-024 | 2026-10-04 | gotcha | A loading.js covers its whole folder: list skeletons flashed on detail pages; use a (list) route group | all | promoted v1.5.0 |
| L-013 | 2026-10-03 | gotcha | Four stat cards in a row clip seven-figure rupee totals at 1440 with the sidebar | type: dashboard | logged |

## Entries

### L-001 · 2026-10-03 · strong · choice
- **Said / saw:** "use this design for UI and UX, just the design, reference this website ... don't add anything new, the rest of the plan is perfect, just the design language should follow the ref site UI"; then chose "Keep reference green" over the client's blue brand.
- **Context:** planning the AM Packaging dashboard
- **Lesson:** When the user names a reference site, copy its design language (tokens, shell, cards, tables, forms) closely, including its palette and typeface even where the anti-slop gate would flag them, and take none of its features. Record the palette as a project exception in CLAUDE.md.
- **Scope:** type: dashboard
- **Target in skill:** references/types/dashboard.md, new section "Reference designs"
- **Status:** promoted v1.5.0

### L-002 · 2026-10-03 · strong · rule
- **Said / saw:** "the side bar should collapse into icons when clicked on burger menu button like on the reference site"
- **Context:** plan review, AM Packaging
- **Lesson:** Admin dashboards get a burger that collapses the sidebar to an icon rail on desktop (state saved and applied before paint, tooltips on hover and focus) and opens a drawer on phones.
- **Scope:** type: dashboard
- **Target in skill:** references/types/dashboard.md, shell section
- **Status:** promoted v1.5.0

### L-003 · 2026-10-03 · strong · gap
- **Said / saw:** "Also add an activity page, where the admin can see all the activity logs of actions performed in the application and filter by who performed those actions"
- **Context:** plan review, AM Packaging
- **Lesson:** Any business app with more than one user gets an append-only activity log written by Postgres triggers (actor, action, module, readable summary, before/after JSON), an admin page filterable by user, module, action and dates, and a link from each user to their activity.
- **Scope:** type: dashboard
- **Target in skill:** references/types/dashboard.md; small-business-ledger-app
- **Status:** promoted v1.5.0

### L-004 · 2026-10-03 · medium · rule
- **Said / saw:** "Add necessary graphs too on the dashboard and reports page"
- **Context:** plan review, AM Packaging
- **Lesson:** Plans for dashboards list the charts per page up front (dashboard and each report), not only tables and KPI cards.
- **Scope:** type: dashboard
- **Target in skill:** references/types/dashboard.md, planning checklist
- **Status:** logged

### L-005 · 2026-10-03 · strong · rule
- **Said / saw:** answers to open questions: "client can add that later in the application, in the setting page if possible", "client will decide in application, in the settings page" (four times)
- **Context:** questions about sizes, units, recipes and invoice format
- **Lesson:** Business facts the client can maintain (sizes, units, brands, recipes, invoice details) become editable lists in Settings with sensible seeds; do not block the build on them.
- **Scope:** type: dashboard
- **Target in skill:** SKILL.md section 2 (questions) and references/types/dashboard.md
- **Status:** promoted v1.5.0

### L-006 · 2026-10-03 · medium · gotcha
- **Said / saw:** `net::ERR_CERT_AUTHORITY_INVALID` from Playwright Chromium on invenza-html.vercel.app, with and without the proxy option
- **Context:** studying the reference design in a cloud session
- **Lesson:** In cloud sessions, mirror a reference page with `wget --ca-certificate=/root/.ccr/ca-bundle.crt -p -k -E -H` and screenshot the local copy (abort external requests in Playwright); never disable TLS checks.
- **Scope:** all
- **Target in skill:** references/types/site-clone.md
- **Status:** promoted v1.5.0

### L-007 · 2026-10-03 · medium · gotcha
- **Said / saw:** Whisper translate gave "79mm", "48mm", "78 yard"; the user corrected to 69mm, 46mm, 70 yard
- **Context:** transcribing three Urdu client voice notes with faster-whisper (medium, CPU)
- **Lesson:** For Urdu voice notes, read the Urdu transcript rather than the English translation, list every number heard, and ask the user to confirm them before seeding data.
- **Scope:** all
- **Target in skill:** SKILL.md section 2
- **Status:** promoted v1.5.0

### L-008 · 2026-10-03 · strong · choice
- **Said / saw:** chose "Admins only (Recommended)" for supplier balances, ledger and payments
- **Context:** phase 2 planning, AM Packaging
- **Lesson:** Recorded in CLAUDE.md for this project. Workers record purchases without a payment; RLS, post_purchase and the pages all enforce it.
- **Scope:** project
- **Target in skill:** none (project rule)
- **Status:** project

### L-009 · 2026-10-03 · medium · gotcha
- **Said / saw:** scroll check: 1024 /admin/stock table needs sideways scroll by 238px; ledger hid its Balance column at 1440 beside a 380px side column
- **Context:** phase 2 render checks
- **Lesson:** In a dashboard with a 260px sidebar, switch money tables to cards below 1280px (not 768px), keep side columns beside a ledger only from 1536px, and add a render check that fails when any `.overflow-x-auto` table needs a sideways scroll at 1024 to 1440.
- **Scope:** type: dashboard
- **Target in skill:** references/types/dashboard.md; small-business-ledger-app references/verifying-ui.md
- **Status:** promoted v1.5.0

### L-010 · 2026-10-03 · medium · gotcha
- **Said / saw:** "Functions cannot be passed directly to Client Components" when a server page passed `triggerIcon={Ban}` to a client dialog
- **Context:** purchase detail page, phase 2
- **Lesson:** Props from server to client components must be serialisable: pass icons as elements (`icon={<Ban size={16} />}`), never as component references. The build does not catch it; only rendering the page does.
- **Scope:** all
- **Target in skill:** references/folder-structure.md or conventions
- **Status:** covered (kodexa-builder 1.4.0, dashboard.md section 4: icons cross the boundary by name)

### L-011 · 2026-10-03 · strong · correction
- **Said / saw:** "fix the search bars where when i start typing the search should start and update the list below"
- **Context:** list pages (Stock, Purchases, Activity...) used a search that applied on Enter or an Apply button
- **Lesson:** List search filters as you type: debounce about 300ms, update the URL with router.replace (not push) inside a transition, keep focus in the box, show the global loading bar without dimming, reset to page 1, and drop the Apply button in favour of a Clear filters button that appears only when a filter is set.
- **Scope:** all
- **Target in skill:** references/types/dashboard.md (filters) and references/loading-states.md (useTrackPending for search)
- **Status:** promoted v1.5.0

### L-012 · 2026-10-03 · strong · choice
- **Said / saw:** chose "Record cash received, no balances" for workers on sales
- **Context:** phase 4 planning, AM Packaging
- **Lesson:** Recorded in CLAUDE.md for this project. A worker can enter the cash taken when making an invoice; the payment row is written by security-definer `post_sale`, and RLS keeps `customer_payments` admin-only otherwise. Workers see "Recorded" or "Void", never paid or balance.
- **Scope:** project
- **Target in skill:** none (project rule); the pattern (definer posting function as the only worker path into an admin-only table) may suit small-business-ledger-app
- **Status:** project

### L-013 · 2026-10-03 · medium · gotcha
- **Said / saw:** render check flagged "Rs 1,307,200" clipped in a four-across StatCard row at 1440 with the 260px sidebar
- **Context:** sales list, phase 4
- **Lesson:** In rupee dashboards with a sidebar, put money StatCards four across only from 1536px (2xl) and two by two below; a clipped-figure check on `.num` elements catches it.
- **Scope:** type: dashboard
- **Target in skill:** references/types/dashboard.md; small-business-ledger-app references/verifying-ui.md
- **Status:** logged

### L-014 · 2026-10-03 · strong · correction
- **Said / saw:** "when clicked on the new customer button it opens a new tab i dont want that"
- **Context:** New Invoice form, "New customer" link had target="_blank"
- **Lesson:** A link to add a missing record from inside a form opens in the same tab, and saving returns to the form with the new record picked (`?from=invoice`, then `?customer=:id`). Never open new tabs in an app for less screen-confident users.
- **Scope:** all
- **Target in skill:** references/types/dashboard.md (forms)
- **Status:** promoted v1.5.0

### L-015 · 2026-10-03 · strong · gotcha
- **Said / saw:** user screenshot: dark mode select opened as a white list with near-white option text (Windows Chrome)
- **Context:** `.dark .form-select` had a translucent background (rgb 255 255 255 / 0.05); `color-scheme: dark` was set but options still painted white
- **Lesson:** In dark mode give `select option, select optgroup` a solid background and text colour from the tokens, and set their font to inherit. Screenshots cannot show the open list, so check the computed style of `option` in the render check.
- **Scope:** all
- **Target in skill:** references/theming or dark-mode section; verifying-ui
- **Status:** promoted v1.5.0

### L-016 · 2026-10-03 · medium · gap
- **Said / saw:** "check any other areas which requires fixing" after a dark mode bug; a measured audit found brand green text at 2.65:1 and red at 3.8:1 on 300+ elements
- **Context:** AM Packaging, both themes
- **Lesson:** Ship a contrast audit with the render checks: walk every text node, composite its colour over the real background (alpha and opacity included), and flag below 4.5:1 (3:1 for large text) in light and dark. When a chosen brand colour fails as text, keep it as the fill and add an `-ink` text token rather than changing the palette.
- **Scope:** all
- **Target in skill:** small-business-ledger-app references/verifying-ui.md; anti-slop gate
- **Status:** promoted v1.5.0

### L-017 · 2026-10-04 · strong · gotcha
- **Said / saw:** plan called for "cartons per product over time (stacked bar)", "stock by category donut in units" and a material-use line; finished goods are ctn, roll and bdl, raw materials pcs, kg and m
- **Context:** phase 5 charts, AM Packaging
- **Lesson:** In an inventory with mixed units, a chart never adds quantities across units. Chart one category or material at a time (pills or a picker, unit in the label), and use rupees whenever a chart sums across categories. Say so when this changes a planned chart.
- **Scope:** type: dashboard
- **Target in skill:** references/types/dashboard.md (charts); small-business-ledger-app
- **Status:** logged

### L-018 · 2026-10-04 · medium · gotcha
- **Said / saw:** first render of daily Sales vs Purchases as monotone areas showed smooth hills between single invoices; material use as lines curved between run days
- **Context:** dashboard and Reports, sparse daily data
- **Lesson:** Totals per day, week or month are columns. Lines only for continuous measures. If a line is needed, use linear segments, not monotone curves.
- **Scope:** all
- **Target in skill:** dataviz choosing-a-form (period totals)
- **Status:** logged

### L-019 · 2026-10-04 · medium · gap
- **Said / saw:** the first profit report showed a tape carton costing Rs 37,900 to make against a Rs 4,800 price; the demo recipe used 3,950 m of jumbo roll per carton
- **Context:** phase 5, demo data built in phase 3
- **Lesson:** Sanity-check demo numbers against the domain (cost vs price, material per unit) when seeding, and treat the first profit or margin report as a data check.
- **Scope:** type: dashboard
- **Target in skill:** small-business-ledger-app (demo data)
- **Status:** logged

### L-020 · 2026-10-04 · strong · stale
- **Said / saw:** `slop_scan.py` warned "Inter appears to be the only typeface" with `Palette exceptions: Inter as the only typeface, ...` in CLAUDE.md, and noted "dark-only colour scheme" for an app that is light by default with `color-scheme: dark` inside `.dark { }`
- **Context:** phase 6 anti-slop gate, AM Packaging
- **Lesson:** The scanner should match an exception keyword anywhere in a listed phrase ("Inter as the only typeface" allows `inter`), and only call a site dark-only when `:root` or `html` sets `color-scheme: dark` with no light scheme, not when a `.dark` class does.
- **Scope:** all
- **Target in skill:** scripts/slop_scan.py (load_exceptions, dark_only)
- **Status:** promoted v1.5.0

### L-021 · 2026-10-04 · medium · gotcha
- **Said / saw:** moving two constants out of a module with `export { A, B } from "./x"` left `A` undefined inside it; `npx eslint .` and `npm run build` passed, and the Reports page showed its error screen (React error #441 in production)
- **Context:** phase 6, caught by the site audit before commit
- **Lesson:** In plain-JavaScript Next repos add `no-undef` (with `globals.browser` and `globals.node`) to `eslint.config.mjs`: eslint-config-next leaves undefined names to TypeScript, so a JS repo has no guard. Remember that `export { x } from` re-exports without binding `x` locally.
- **Scope:** all
- **Target in skill:** SKILL.md section 3 house defaults (lint) and references/folder-structure.md
- **Status:** promoted v1.5.0

### L-022 · 2026-10-04 · strong · stale
- **Said / saw:** dashboard.md section 2 says "`npm run check` = lint + build"; SKILL.md section 5 says `npm run check` runs the repo's Playwright regression checks in `scripts/checks/`
- **Context:** setting up AM Packaging's checks
- **Lesson:** One meaning: `npm run check` is the Playwright regression checks; lint and build stay `npx eslint .` and `npm run build`. Dashboards also ship the checks that suit data screens (figures in cards, table sideways scroll, contrast in both themes, dark select options, 44px touch targets).
- **Scope:** type: dashboard
- **Target in skill:** references/types/dashboard.md sections 2 and 11; assets/checks
- **Status:** promoted v1.5.0

### L-023 · 2026-10-04 · medium · repeat
- **Said / saw:** the new `tables` and `figures` checks failed on `/admin/stock/[id]`, a phase 1 page still switching tables to cards at 768px (434px sideways scroll at 1024) after L-009 moved every later page to 1280px
- **Context:** phase 6, second occurrence of L-009
- **Lesson:** When a layout rule changes mid-build, sweep the pages built before it; and make the dashboard checks walk every route (detail pages and report tabs included), not a sample, since the drift hides on the pages nobody screenshots.
- **Scope:** type: dashboard
- **Target in skill:** references/types/dashboard.md section 11
- **Status:** promoted v1.5.0

### L-024 · 2026-10-04 · low · gotcha
- **Said / saw:** a `loading.js` beside the dashboard (`app/admin/page.js`) is also the loading screen for every route under `/admin` without its own
- **Context:** phase 6 loading screens
- **Lesson:** A `loading.js` covers its folder and every route below it. Put a generic loading screen in the shell folder, and put each list page with its own `loading.js` in a `(list)` route group, so `/sales/new` and `/sales/[id]` do not flash the list skeleton (happened a second time in this phase, caught by the checks).
- **Scope:** all
- **Target in skill:** references/loading-states.md
- **Status:** promoted v1.5.0
