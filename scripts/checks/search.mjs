// Search filters as you type, with no Enter and no Apply button. The user
// asked for it: "when i start typing the search should start and update the
// list below".
import { open } from "./pages.mjs";

export default async function search({ base, browser, ok }) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await open(page, base, "/admin/stock");
  const rows = () => page.locator("table.data-table tbody tr").count();
  const before = await rows();
  // The page's own filter box, not the header search (which also searches live).
  await page.locator('main input[type="search"][name="q"]').first().pressSequentially("jumbo", { delay: 40 });
  await page.waitForURL(/[?&]q=jumbo/, { timeout: 4000 }).catch(() => {});
  await page.waitForLoadState("networkidle");
  const after = await rows();
  ok("typing filters the list without pressing Enter", page.url().includes("q=jumbo") && after > 0 && after < before, `${before} rows, then ${after}; ${page.url()}`);
  const focused = await page.evaluate(() => (document.activeElement?.closest("main") ? document.activeElement.getAttribute("name") : "outside the page"));
  ok("the search box keeps focus while the list updates", focused === "q", `focus on ${focused}`);
  await page.close();
}
