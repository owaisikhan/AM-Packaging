// Every link, button and field is at least 44px on a touch phone. The users
// are mixed ages on phones; a 40px header button and 16px breadcrumb links
// were below it until phase 6.
import { PAGES, eachPage } from "./pages.mjs";

export default async function taps({ base, browser, ok, pages }) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const problems = await eachPage(context, base, pages || PAGES, async (page) => {
    const small = await page.$$eval("a, button, select, input, textarea", (els) =>
      els
        .filter((e) => {
          const s = getComputedStyle(e);
          const r = e.getBoundingClientRect();
          return s.visibility !== "hidden" && s.display !== "none" && r.width > 1 && r.height > 1 && !e.closest("[aria-hidden='true']") && !["hidden", "checkbox", "radio"].includes(e.type);
        })
        .map((e) => {
          const r = e.getBoundingClientRect();
          return { t: (e.innerText || e.getAttribute("aria-label") || e.name || "").trim().slice(0, 24), w: Math.round(r.width), h: Math.round(r.height) };
        })
        .filter((x) => x.w < 44 || x.h < 44),
    );
    return small.slice(0, 2).map((s) => `"${s.t}" ${s.w}x${s.h}`);
  });
  ok("touch targets are at least 44px on a phone", problems.length === 0, problems.slice(0, 4).join("; "));
  await context.close();
}
