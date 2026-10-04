// The pages every check walks (demo mode ids). Keep in step with the app.
export const PAGES = [
  "/admin",
  "/admin/guide",
  "/admin/guide?lang=ur",
  "/admin/stock",
  "/admin/stock/i-t-46-72-40c",
  "/admin/stock/adjust",
  "/admin/raw-materials",
  "/admin/raw-materials/new",
  "/admin/products",
  "/admin/production",
  "/admin/production/new",
  "/admin/production/pr-11",
  "/admin/purchases",
  "/admin/purchases/new",
  "/admin/purchases/pu-1",
  "/admin/sales",
  "/admin/sales/new",
  "/admin/sales/sa-16",
  "/admin/customers",
  "/admin/customers/new",
  "/admin/customers/cus-ftl",
  "/admin/suppliers",
  "/admin/suppliers/sup-lfc",
  "/admin/activity",
  "/admin/users",
  "/admin/settings",
  "/admin/settings?tab=categories",
  "/admin/settings?tab=brands",
  "/admin/settings?tab=sizes",
  "/admin/settings?tab=microns",
  "/admin/settings?tab=colors",
  "/admin/settings?tab=units",
  "/admin/settings?tab=recipes",
  "/admin/users/demo-w1",
  "/admin/customers/cus-ftl/edit",
  "/admin/suppliers/sup-lfc/edit",
  "/admin/reports?tab=sales",
  "/admin/reports?tab=purchases",
  "/admin/reports?tab=production",
  "/admin/reports?tab=materials",
  "/admin/reports?tab=stock",
  "/admin/reports?tab=balances",
  "/admin/reports?tab=profit",
  "/login",
];

/** A browser context in a given theme ("light" or "dark"), as the header toggle saves it. */
export async function themedContext(browser, theme, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options });
  await context.addInitScript((t) => {
    try {
      localStorage.setItem("am_theme", t);
    } catch {}
  }, theme);
  return context;
}

/** Load a page and let it hydrate (charts measure themselves after load). */
export async function open(page, base, path) {
  await page.goto(`${base}${path}`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  // A streamed page shows its loading screen first; wait until it is replaced.
  await page.waitForFunction(() => !document.querySelector('main [aria-busy="true"]'), null, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(300);
}

/**
 * Visit every path in one browser context, four at a time, and collect what
 * fn(page, path) returns (an array of problem strings).
 */
export async function eachPage(context, base, paths, fn, concurrency = 4) {
  const queue = [...paths];
  const found = [];
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      const page = await context.newPage();
      for (let path = queue.shift(); path; path = queue.shift()) {
        await open(page, base, path);
        for (const f of (await fn(page, path)) ?? []) found.push(`${path}: ${f}`);
      }
      await page.close();
    }),
  );
  return found;
}
