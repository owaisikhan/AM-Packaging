// Every page renders its own content, with nothing in the console.
// Caught: a server page passing an icon component to a client component
// (crashed only when rendered; the build passed), and a name lost in a
// refactor that left the Reports page on the error screen.
import { PAGES, eachPage } from "./pages.mjs";

export default async function pagesRender({ base, browser, ok, pages }) {
  for (const [label, options] of [
    ["desktop", { viewport: { width: 1440, height: 900 } }],
    ["phone", { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
  ]) {
    const context = await browser.newContext(options);
    const logged = [];
    context.on("console", (m) => {
      if (["error", "warning"].includes(m.type())) logged.push(`${new URL(m.page().url()).pathname}: ${m.text().slice(0, 120)}`);
    });
    context.on("weberror", (e) => logged.push(`${e.page()?.url() ?? ""}: ${e.error().message.slice(0, 120)}`));
    const problems = await eachPage(context, base, pages || PAGES, async (page) => {
      const h1 = ((await page.locator("h1").first().textContent().catch(() => "")) ?? "").trim();
      if (/did not load|not found/i.test(h1)) return [`shows "${h1}"`];
      return h1 ? [] : ["no heading"];
    });
    problems.push(...logged);
    ok(`every page renders, console clean (${label})`, problems.length === 0, problems.slice(0, 3).join("; "));
    await context.close();
  }
}
