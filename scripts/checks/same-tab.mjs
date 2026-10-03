// Adding a missing customer or supplier from inside a form stays in the same
// tab and comes back to the form. The user: "when clicked on the new
// customer button it opens a new tab i dont want that".
import { PAGES, eachPage, open } from "./pages.mjs";

export default async function sameTab({ base, browser, ok, pages }) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const blank = await eachPage(context, base, pages || PAGES, async (page) => {
    const n = await page.locator('main a[target="_blank"]').count();
    return n ? [`${n} link(s)`] : [];
  });
  await context.close();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  ok("no link opens a new tab", blank.length === 0, blank.join("; "));
  for (const [path, label, back] of [
    ["/admin/sales/new", "New customer", "/admin/sales/new"],
    ["/admin/purchases/new", "New supplier", "/admin/purchases/new"],
  ]) {
    await open(page, base, path);
    await page.getByRole("link", { name: label }).click();
    await page.waitForLoadState("networkidle");
    const backHref = await page.getByRole("link", { name: /Back to New/ }).getAttribute("href").catch(() => null);
    ok(`"${label}" opens in this tab and links back to the form`, page.url().includes("?from=") && backHref === back, `${page.url()}, back to ${backHref}`);
  }
  await page.close();
}
