// Picking dates works. Reports > Period > "Pick dates" sent no dates, so the
// page fell back to the last 30 days and the From/To boxes never appeared,
// while the select still read "Pick dates". The list filters' From box is
// checked too.
import { open } from "./pages.mjs";

export default async function dates({ base, browser, ok }) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await open(page, base, "/admin/reports?tab=sales");
  await page.selectOption("#r-range", "custom");
  await page.waitForURL(/range=custom.*from=\d{4}-\d{2}-\d{2}.*to=\d{4}-\d{2}-\d{2}/, { timeout: 6000 }).catch(() => {});
  await page.waitForLoadState("networkidle");
  const from = page.locator("#r-from");
  const shown = (await from.count()) ? await from.inputValue() : "";
  ok("Pick dates shows filled From and To boxes", /range=custom/.test(page.url()) && /^\d{4}-\d{2}-\d{2}$/.test(shown) && (await page.locator("#r-to").count()) === 1, `${page.url()}, From "${shown}"`);
  ok("the Period box still says Pick dates", (await page.locator("#r-range").inputValue()) === "custom", await page.locator("#r-range").inputValue());

  if (shown) {
    await from.fill("2026-09-01");
    await page.waitForURL(/from=2026-09-01/, { timeout: 6000 }).catch(() => {});
    await page.waitForLoadState("networkidle");
    const label = await page.locator("main form p").filter({ hasText: "Showing" }).innerText();
    ok("changing From changes the period shown", page.url().includes("from=2026-09-01") && /01 Sept 2026/.test(label), label);
  }

  await open(page, base, "/admin/purchases");
  await page.locator('main input[type="date"][name="from"]').fill("2026-10-01");
  await page.waitForURL(/[?&]from=2026-10-01/, { timeout: 6000 }).catch(() => {});
  ok("a list page's From date filters the list", page.url().includes("from=2026-10-01"), page.url());

  await page.close();
}
