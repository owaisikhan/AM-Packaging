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
| L-001 | 2026-10-03 | choice | Given a reference site, copy its design language exactly, palette included, and none of its features | type: dashboard | logged |
| L-002 | 2026-10-03 | rule | Dashboard sidebar collapses to an icon rail from the burger, with tooltips | type: dashboard | logged |
| L-003 | 2026-10-03 | gap | Multi-user business apps get an admin Activity log filterable by user | type: dashboard | logged |
| L-004 | 2026-10-03 | rule | Plan charts on the dashboard and reports from the start | type: dashboard | logged |
| L-005 | 2026-10-03 | rule | Business lists the client "will decide" go in Settings, not in questions | type: dashboard | logged |
| L-006 | 2026-10-03 | gotcha | Playwright in cloud sessions cannot open external sites; mirror with wget | all | logged |
| L-007 | 2026-10-03 | gotcha | Urdu voice notes: Whisper transcript is good, numbers in the translation are not | all | logged |
| L-008 | 2026-10-03 | choice | Supplier money (balances, ledger, payments) admin-only; workers record bills | project | project |
| L-009 | 2026-10-03 | gotcha | Card/table switch at 768px is too low with a 260px sidebar; use 1280px | type: dashboard | logged |
| L-010 | 2026-10-03 | gotcha | Never pass an icon component into a client component; pass an element | all | logged |

## Entries

### L-001 · 2026-10-03 · strong · choice
- **Said / saw:** "use this design for UI and UX, just the design, reference this website ... don't add anything new, the rest of the plan is perfect, just the design language should follow the ref site UI"; then chose "Keep reference green" over the client's blue brand.
- **Context:** planning the AM Packaging dashboard
- **Lesson:** When the user names a reference site, copy its design language (tokens, shell, cards, tables, forms) closely, including its palette and typeface even where the anti-slop gate would flag them, and take none of its features. Record the palette as a project exception in CLAUDE.md.
- **Scope:** type: dashboard
- **Target in skill:** references/types/dashboard.md, new section "Reference designs"
- **Status:** logged

### L-002 · 2026-10-03 · strong · rule
- **Said / saw:** "the side bar should collapse into icons when clicked on burger menu button like on the reference site"
- **Context:** plan review, AM Packaging
- **Lesson:** Admin dashboards get a burger that collapses the sidebar to an icon rail on desktop (state saved and applied before paint, tooltips on hover and focus) and opens a drawer on phones.
- **Scope:** type: dashboard
- **Target in skill:** references/types/dashboard.md, shell section
- **Status:** logged

### L-003 · 2026-10-03 · strong · gap
- **Said / saw:** "Also add an activity page, where the admin can see all the activity logs of actions performed in the application and filter by who performed those actions"
- **Context:** plan review, AM Packaging
- **Lesson:** Any business app with more than one user gets an append-only activity log written by Postgres triggers (actor, action, module, readable summary, before/after JSON), an admin page filterable by user, module, action and dates, and a link from each user to their activity.
- **Scope:** type: dashboard
- **Target in skill:** references/types/dashboard.md; small-business-ledger-app
- **Status:** logged

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
- **Status:** logged

### L-006 · 2026-10-03 · medium · gotcha
- **Said / saw:** `net::ERR_CERT_AUTHORITY_INVALID` from Playwright Chromium on invenza-html.vercel.app, with and without the proxy option
- **Context:** studying the reference design in a cloud session
- **Lesson:** In cloud sessions, mirror a reference page with `wget --ca-certificate=/root/.ccr/ca-bundle.crt -p -k -E -H` and screenshot the local copy (abort external requests in Playwright); never disable TLS checks.
- **Scope:** all
- **Target in skill:** references/types/site-clone.md
- **Status:** logged

### L-007 · 2026-10-03 · medium · gotcha
- **Said / saw:** Whisper translate gave "79mm", "48mm", "78 yard"; the user corrected to 69mm, 46mm, 70 yard
- **Context:** transcribing three Urdu client voice notes with faster-whisper (medium, CPU)
- **Lesson:** For Urdu voice notes, read the Urdu transcript rather than the English translation, list every number heard, and ask the user to confirm them before seeding data.
- **Scope:** all
- **Target in skill:** SKILL.md section 2
- **Status:** logged

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
- **Status:** logged

### L-010 · 2026-10-03 · medium · gotcha
- **Said / saw:** "Functions cannot be passed directly to Client Components" when a server page passed `triggerIcon={Ban}` to a client dialog
- **Context:** purchase detail page, phase 2
- **Lesson:** Props from server to client components must be serialisable: pass icons as elements (`icon={<Ban size={16} />}`), never as component references. The build does not catch it; only rendering the page does.
- **Scope:** all
- **Target in skill:** references/folder-structure.md or conventions
- **Status:** logged
