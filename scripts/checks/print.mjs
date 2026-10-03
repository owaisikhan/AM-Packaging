// Printing an invoice prints only the invoice: no menu, header, demo banner
// or admin payment panel.
import { open } from "./pages.mjs";

export default async function print({ base, browser, ok }) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.emulateMedia({ media: "print" });
  await open(page, base, "/admin/sales/sa-16");
  const shown = await page.evaluate(() =>
    [".app-sidebar", ".app-header", ".app-footer", ".no-print"].filter((sel) => [...document.querySelectorAll(sel)].some((el) => el.offsetParent || getComputedStyle(el).display !== "none")),
  );
  const sheet = await page.locator(".invoice-sheet").isVisible();
  ok("printing shows the invoice sheet and nothing else", sheet && shown.length === 0, shown.length ? `also printed: ${shown.join(", ")}` : sheet ? "" : "no invoice sheet");
  await page.close();
}
