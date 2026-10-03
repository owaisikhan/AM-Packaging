// Every chart draws, and its axis labels stay on one line. Caught while
// building phase 5: "Rs 10.5 lakh" wrapped onto two lines in a narrow axis.
import { open, themedContext } from "./pages.mjs";

const CHART_PAGES = ["/admin", "/admin/reports?tab=sales", "/admin/reports?tab=production", "/admin/reports?tab=materials", "/admin/reports?tab=stock", "/admin/reports?tab=profit"];

export default async function charts({ base, browser, ok }) {
  for (const [w, theme] of [[1440, "light"], [390, "dark"]]) {
    const context = await themedContext(browser, theme, { viewport: { width: w, height: 900 } });
    const page = await context.newPage();
    const problems = [];
    for (const path of CHART_PAGES) {
      await open(page, base, path);
      const r = await page.evaluate(() => ({
        boxes: document.querySelectorAll(".recharts-responsive-container").length,
        blank: [...document.querySelectorAll(".recharts-responsive-container")].filter((c) => !c.querySelector("svg .recharts-layer")).length,
        // Recharts 3 draws tick labels outside the axis group, so look at every one.
        wrapped: [...document.querySelectorAll(".recharts-wrapper .recharts-cartesian-axis-tick-value")].filter((t) => t.querySelectorAll("tspan").length > 1).length,
      }));
      if (r.boxes === 0) problems.push(`${path}: no chart on the page`);
      if (r.blank) problems.push(`${path}: ${r.blank} chart(s) drew nothing`);
      if (r.wrapped) problems.push(`${path}: ${r.wrapped} axis label(s) wrap`);
    }
    ok(`charts draw, axis labels on one line (${w}px ${theme})`, problems.length === 0, problems.slice(0, 3).join("; "));
    await context.close();
  }
}
