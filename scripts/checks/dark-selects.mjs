// In dark mode the open list of every select is readable. Caught: on Windows
// the list painted white under the light dark-mode text, because the
// see-through select colour does not reach the options (the user's
// screenshot). The open list cannot be screenshotted, so read the options'
// own colours.
import { open, themedContext } from "./pages.mjs";
import { contrast, parseColor } from "./color.mjs";

const PAGES_WITH_SELECTS = ["/admin/sales/new", "/admin/purchases/new", "/admin/production/new", "/admin/stock", "/admin/reports?tab=materials"];

export default async function darkSelects({ base, browser, ok }) {
  const context = await themedContext(browser, "dark");
  const page = await context.newPage();
  const problems = [];
  for (const path of PAGES_WITH_SELECTS) {
    await open(page, base, path);
    const options = await page.evaluate(() =>
      [...document.querySelectorAll("select option")].slice(0, 40).map((o) => {
        const s = getComputedStyle(o);
        return { text: o.textContent.trim().slice(0, 30), fg: s.color, bg: s.backgroundColor };
      }),
    );
    for (const o of options) {
      const bg = parseColor(o.bg);
      if (!bg || bg.a < 1) {
        problems.push(`${path}: "${o.text}" has no solid background`);
        break;
      }
      const ratio = contrast(parseColor(o.fg), bg);
      if (ratio < 4.5) {
        problems.push(`${path}: "${o.text}" is ${ratio.toFixed(2)}:1`);
        break;
      }
    }
  }
  ok("dark mode select options are solid and readable", problems.length === 0, problems.slice(0, 3).join("; "));
  await context.close();
}
