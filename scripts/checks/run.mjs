// AM Packaging's regression checks: one per bug that looked fine by eye and
// passed the build, each proven once by putting its bug back and watching it
// fail. Runs against demo mode (no database env), so nothing is ever saved.
// Run against a production build:
//
//   npm run build && npm start          (in one terminal)
//   npm run check                        (in another)
//   npm run check -- --base http://localhost:3100 --only contrast,taps --pages /admin,/login
//
// A form check must never let a request reach the server unless --allow-submit
// is passed, and that only against a build made WITHOUT the database env:
// abort POSTs with page.route (see SKILL.md section 5). Exit code 1 on failure.

import { chromium } from "playwright";

// One module per bug that shipped or nearly did, registered below.
import pagesRender from "./pages-render.mjs";
import overflow from "./overflow.mjs";
import figures from "./figures.mjs";
import tables from "./tables.mjs";
import contrast from "./contrast.mjs";
import darkSelects from "./dark-selects.mjs";
import charts from "./charts.mjs";
import taps from "./taps.mjs";
import search from "./search.mjs";
import print from "./print.mjs";
import sameTab from "./same-tab.mjs";
import dates from "./dates.mjs";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith("--")) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith("--") ? all[i + 1] : true]);
    return acc;
  }, [])
);

const BASE = args.base || "http://localhost:3000";
const ALL = { pages: pagesRender, overflow, figures, tables, contrast, "dark-selects": darkSelects, charts, taps, search, print, "same-tab": sameTab, dates };
const only = typeof args.only === "string" ? args.only.split(",") : Object.keys(ALL);

// In Claude Code on the web, Chromium is preinstalled at /opt/pw-browsers and
// must not be downloaded. Elsewhere, run `npx playwright install chromium` once.
const launch = { headless: true };
if (process.env.PLAYWRIGHT_BROWSERS_PATH === "/opt/pw-browsers") launch.executablePath = "/opt/pw-browsers/chromium";

try {
  await fetch(BASE);
} catch {
  console.error(`Nothing is answering at ${BASE}. Start the site first (npm run build && npm start).`);
  process.exit(1);
}

const browser = await chromium.launch(launch);
let failures = 0;

// Each check gets these and reports with ok(label, passed, detail).
const ctx = {
  base: BASE,
  browser,
  allowSubmit: Boolean(args["allow-submit"]),
  pages: typeof args.pages === "string" ? args.pages.split(",") : null,
  ok(label, passed, detail = "") {
    if (!passed) failures++;
    console.log(`  ${passed ? "ok  " : "FAIL"} ${label}${detail ? `  (${detail})` : ""}`);
  },
};

for (const name of only) {
  if (!ALL[name]) {
    console.error(`Unknown check "${name}". Choose from: ${Object.keys(ALL).join(", ")}`);
    process.exit(1);
  }
  console.log(`\n${name}`);
  try {
    await ALL[name](ctx);
  } catch (e) {
    failures++;
    console.log(`  FAIL ${name} stopped: ${e.message.split("\n")[0]}`);
  }
}

await browser.close();
console.log(failures ? `\n${failures} check(s) failed.` : "\nAll checks passed.");
process.exit(failures ? 1 : 0);
