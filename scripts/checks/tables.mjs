// No table needs a sideways scroll on laptop and desktop widths. Caught: with
// the 260px sidebar, money tables scrolled sideways at 1024 to 1280 until
// tables switched to cards below 1280px.
import { PAGES, eachPage } from "./pages.mjs";

export default async function tables({ base, browser, ok, pages }) {
  for (const w of [1024, 1280, 1440]) {
    const context = await browser.newContext({ viewport: { width: w, height: 900 } });
    const problems = await eachPage(context, base, pages || PAGES, async (page) => {
      const over = await page.evaluate(() =>
        [...document.querySelectorAll(".overflow-x-auto")]
          .filter((el) => el.offsetParent && el.querySelector("table") && el.scrollWidth > el.clientWidth + 1)
          .map((el) => el.scrollWidth - el.clientWidth),
      );
      return over.length ? [`table scrolls ${over.join(", ")}px`] : [];
    });
    ok(`no table scrolls sideways at ${w}px`, problems.length === 0, problems.slice(0, 3).join("; "));
    await context.close();
  }
}
