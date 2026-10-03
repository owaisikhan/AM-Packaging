// Nothing sticks out past a phone screen, element by element. A page-level
// "no sideways scroll" check missed a WhatsApp button that ran off a success
// screen (kodexa-website), because its section had overflow:hidden. This looks
// at every leaf element and at clipping parents instead.

const WIDTHS = [320, 390];
// Every page in the app (pages.mjs). Override per run with --pages /admin,/login.
import { PAGES, eachPage } from "./pages.mjs";

function scan() {
  const W = document.documentElement.clientWidth;
  const leaf = new Set(["A", "BUTTON", "INPUT", "TEXTAREA", "LABEL", "H1", "H2", "H3", "P", "LI", "IMG", "svg"]);
  const bad = [];
  for (const e of document.querySelectorAll("body *")) {
    if (!leaf.has(e.tagName)) continue;
    if (e.closest("[aria-hidden='true'], .sr-only, [class*='marquee']")) continue;
    const s = getComputedStyle(e);
    if (s.display === "none" || s.visibility === "hidden") continue;
    const r = e.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    let why = r.right > W + 1 ? `right edge ${Math.round(r.right)} > ${W}` : r.left < -1 ? `left edge ${Math.round(r.left)}` : "";
    for (let a = e.parentElement; !why && a && a !== document.body; a = a.parentElement) {
      if (/hidden|clip/.test(getComputedStyle(a).overflowX)) {
        const ar = a.getBoundingClientRect();
        if (ar.width > 40 && r.right > ar.right + 1) why = `cut off by a clipping parent by ${Math.round(r.right - ar.right)}px`;
      }
    }
    if (why) bad.push(`${e.tagName.toLowerCase()} "${(e.textContent || e.getAttribute("aria-label") || "").trim().slice(0, 40)}": ${why}`);
  }
  return [...new Set(bad)].slice(0, 5);
}

export default async function overflow({ base, browser, ok, pages }) {
  const list = pages || PAGES;
  for (const w of WIDTHS) {
    const context = await browser.newContext({ viewport: { width: w, height: 800 }, isMobile: true, hasTouch: true });
    const problems = await eachPage(context, base, list, async (page) => {
      const sideways = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      const found = await page.evaluate(scan);
      if (sideways > 0) found.unshift(`page scrolls sideways by ${sideways}px`);
      return found;
    });
    ok(`nothing past the edge at ${w}px (${list.length} pages)`, problems.length === 0, problems.slice(0, 3).join("; "));
    await context.close();
  }
}
