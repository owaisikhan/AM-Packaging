// Money and quantities never clip or spill out of their card. Caught: four
// stat cards in a row cut "Rs 1,307,200" at 1440 with the sidebar open, and
// at 320px a stat figure ran past its card (overflow visible, so a clip
// check alone missed it).
import { PAGES, eachPage } from "./pages.mjs";

function scan() {
  const out = [];
  for (const el of document.querySelectorAll(".num")) {
    if (!el.offsetParent) continue;
    const text = el.textContent.trim().slice(0, 30);
    if (el.scrollWidth > el.clientWidth + 1) out.push(`"${text}" is clipped`);
    const card = el.closest(".card, .stat-card, .page-header");
    if (card) {
      const r = el.getBoundingClientRect();
      const c = card.getBoundingClientRect();
      if (r.right > c.right + 1 || r.left < c.left - 1) out.push(`"${text}" spills out of its card`);
    }
  }
  return [...new Set(out)].slice(0, 4);
}

export default async function figures({ base, browser, ok, pages }) {
  for (const [w, h] of [[1440, 900], [1024, 768], [390, 844], [360, 740], [320, 640]]) {
    const context = await browser.newContext({ viewport: { width: w, height: h } });
    const problems = await eachPage(context, base, pages || PAGES, (page) => page.evaluate(scan));
    ok(`no figure clipped or spilling at ${w}px`, problems.length === 0, problems.slice(0, 3).join("; "));
    await context.close();
  }
}
