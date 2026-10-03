import "server-only";
import { createClient } from "./supabase-server";
import { isDemoMode } from "./config";
import * as demo from "./demo-data";

// Every read query lives in this file. Server-only.
// In demo mode (no database configured) the same functions answer from the
// sample data, so the screens can be reviewed before the database exists.

export const PAGE_SIZE = 20;

function unwrap({ data, error }, what) {
  if (error) throw new Error(`Could not load ${what}: ${error.message}`);
  return data;
}

function pageRange(page, perPage = PAGE_SIZE) {
  const p = Math.max(1, Number(page) || 1);
  const from = (p - 1) * perPage;
  return { page: p, from, to: from + perPage - 1 };
}

function demoPage(rows, page, perPage = PAGE_SIZE) {
  const { from } = pageRange(page, perPage);
  return { rows: rows.slice(from, from + perPage), total: rows.length };
}

// ---------------------------------------------------------------
// Settings and lookup tables
// ---------------------------------------------------------------
export async function getSettings() {
  if (isDemoMode) return demo.demoSettings;
  const supabase = await createClient();
  return unwrap(await supabase.from("settings").select("*").eq("id", 1).maybeSingle(), "the company settings");
}

export async function getLookups() {
  if (isDemoMode) {
    return {
      categories: demo.demoCategories,
      units: demo.demoUnits,
      brands: demo.demoBrands,
      sizes: demo.demoSizes,
      microns: demo.demoMicrons,
      colors: demo.demoColors,
    };
  }
  const supabase = await createClient();
  const [categories, units, brands, sizes, microns, colors] = await Promise.all([
    supabase.from("item_categories").select("*").order("kind").order("sort_order").order("name"),
    supabase.from("units").select("*").order("name"),
    supabase.from("brands").select("*").order("name"),
    supabase.from("sizes").select("*").order("width_mm").order("length_yd"),
    supabase.from("microns").select("*").order("value"),
    supabase.from("colors").select("*").order("name"),
  ]);
  return {
    categories: unwrap(categories, "the categories"),
    units: unwrap(units, "the units"),
    brands: unwrap(brands, "the brands"),
    sizes: unwrap(sizes, "the sizes"),
    microns: unwrap(microns, "the microns"),
    colors: unwrap(colors, "the colors"),
  };
}

// ---------------------------------------------------------------
// Items and stock
// ---------------------------------------------------------------

/**
 * One page of items with their stock, filtered.
 * filters: { kind, category, status, q, page }
 */
export async function getStockPage(filters = {}) {
  const { kind, category, status, q, page, active = "active" } = filters;

  if (isDemoMode) {
    const needle = (q || "").toLowerCase();
    const rows = demo.demoItems.filter(
      (r) =>
        (!kind || r.kind === kind) &&
        (!category || r.category_id === category) &&
        (!status || r.stock_status === status) &&
        (active !== "active" || r.active) &&
        (!needle || `${r.name} ${r.code ?? ""} ${r.brand_name ?? ""}`.toLowerCase().includes(needle)),
    );
    return demoPage(rows, page);
  }

  const supabase = await createClient();
  const { from, to } = pageRange(page);
  let query = supabase.from("item_stock").select("*", { count: "exact" });
  if (kind) query = query.eq("kind", kind);
  if (category) query = query.eq("category_id", category);
  if (status) query = query.eq("stock_status", status);
  if (active === "active") query = query.eq("active", true);
  if (q) {
    const safe = q.replace(/[%,()]/g, " ").trim();
    if (safe) query = query.or(`name.ilike.%${safe}%,code.ilike.%${safe}%,brand_name.ilike.%${safe}%`);
  }
  const { data, error, count } = await query
    .order("kind")
    .order("category_name")
    .order("name")
    .range(from, to);
  if (error) throw new Error(`Could not load the stock: ${error.message}`);
  return { rows: data ?? [], total: count ?? 0 };
}

/** Counts for the four stat cards. Worked out by the database, not by paging rows. */
export async function getStockCounts(kind) {
  if (isDemoMode) {
    const rows = demo.demoItems.filter((r) => r.active && (!kind || r.kind === kind));
    return {
      total: rows.length,
      in: rows.filter((r) => r.stock_status === "in").length,
      low: rows.filter((r) => r.stock_status === "low").length,
      out: rows.filter((r) => r.stock_status === "out").length,
    };
  }
  const supabase = await createClient();
  const count = async (status) => {
    let query = supabase.from("item_stock").select("id", { count: "exact", head: true }).eq("active", true);
    if (kind) query = query.eq("kind", kind);
    if (status) query = query.eq("stock_status", status);
    const { count: n, error } = await query;
    if (error) throw new Error(`Could not count the stock: ${error.message}`);
    return n ?? 0;
  };
  const [total, inStock, low, out] = await Promise.all([count(), count("in"), count("low"), count("out")]);
  return { total, in: inStock, low, out };
}

export async function getItem(id) {
  if (isDemoMode) return demo.demoItems.find((r) => r.id === id) ?? null;
  const supabase = await createClient();
  return unwrap(await supabase.from("item_stock").select("*").eq("id", id).maybeSingle(), "the item");
}

/** Raw items for pickers (recipes, purchases). Small table, no paging needed. */
export async function getItemOptions(kind) {
  if (isDemoMode) return demo.demoItems.filter((r) => r.active && (!kind || r.kind === kind));
  const supabase = await createClient();
  let query = supabase.from("item_stock").select("id, name, code, kind, unit, brand_name, on_hand, default_rate").eq("active", true);
  if (kind) query = query.eq("kind", kind);
  return unwrap(await query.order("name"), "the items");
}

export async function getItemMovements(itemId, page = 1) {
  if (isDemoMode) return demoPage(demo.demoMovements, page);
  const supabase = await createClient();
  const { from, to } = pageRange(page);
  const { data, error, count } = await supabase
    .from("stock_movements")
    .select("id, movement_date, qty, type, note, ref_table, ref_id, created_at, profiles(full_name)", { count: "exact" })
    .eq("item_id", itemId)
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw new Error(`Could not load the stock history: ${error.message}`);
  return {
    rows: (data ?? []).map((r) => ({ ...r, actor_name: r.profiles?.full_name ?? "System" })),
    total: count ?? 0,
  };
}

export async function getRecipe(itemId) {
  if (isDemoMode) return demo.demoRecipes[itemId] ?? null;
  const supabase = await createClient();
  const recipe = unwrap(
    await supabase.from("recipes").select("id, notes, recipe_lines(raw_item_id, qty_per_unit)").eq("item_id", itemId).maybeSingle(),
    "the recipe",
  );
  if (!recipe) return null;
  return { notes: recipe.notes, lines: recipe.recipe_lines ?? [] };
}

// ---------------------------------------------------------------
// Users
// ---------------------------------------------------------------
export async function getProfiles() {
  if (isDemoMode) return demo.demoProfiles;
  const supabase = await createClient();
  return unwrap(
    await supabase.from("profiles").select("id, full_name, role, active, created_at").order("role").order("full_name"),
    "the users",
  );
}

// ---------------------------------------------------------------
// Activity log (admins only; RLS returns nothing to workers)
// ---------------------------------------------------------------

/** filters: { user, module, action, from, to, q, page } */
export async function getActivityPage(filters = {}) {
  const { user, module, action, from: dateFrom, to: dateTo, q, page } = filters;

  if (isDemoMode) {
    const needle = (q || "").toLowerCase();
    const rows = demo.demoActivity.filter(
      (r) =>
        (!user || r.user_id === user) &&
        (!module || r.module === module) &&
        (!action || r.action === action) &&
        (!dateFrom || r.created_at.slice(0, 10) >= dateFrom) &&
        (!dateTo || r.created_at.slice(0, 10) <= dateTo) &&
        (!needle || r.summary.toLowerCase().includes(needle)),
    );
    return demoPage(rows, page);
  }

  const supabase = await createClient();
  const { from, to } = pageRange(page);
  let query = supabase.from("activity_log").select("*", { count: "exact" });
  if (user) query = query.eq("user_id", user);
  if (module) query = query.eq("module", module);
  if (action) query = query.eq("action", action);
  // Dates are the business's local days (Pakistan, UTC+5)
  if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00+05:00`);
  if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59.999+05:00`);
  if (q) query = query.ilike("summary", `%${q.replace(/[%_]/g, " ").trim()}%`);
  const { data, error, count } = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).range(from, to);
  if (error) throw new Error(`Could not load the activity log: ${error.message}`);
  return { rows: data ?? [], total: count ?? 0 };
}

/** Today's counts for the stat cards, by the database. */
export async function getActivityCounts(user) {
  if (isDemoMode) {
    const rows = demo.demoActivity.filter((r) => !user || r.user_id === user);
    const today = "2026-10-03";
    const todays = rows.filter((r) => r.created_at.slice(0, 10) === today);
    return {
      today: todays.length,
      created: rows.filter((r) => r.action === "created").length,
      updated: rows.filter((r) => r.action === "updated" || r.action === "adjusted").length,
      deleted: rows.filter((r) => r.action === "deleted" || r.action === "voided").length,
    };
  }
  const supabase = await createClient();
  const start = new Date();
  const todayPk = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(start);
  const count = async (apply) => {
    let query = supabase.from("activity_log").select("id", { count: "exact", head: true });
    if (user) query = query.eq("user_id", user);
    query = apply(query);
    const { count: n, error } = await query;
    if (error) throw new Error(`Could not count the activity: ${error.message}`);
    return n ?? 0;
  };
  const [today, created, updated, deleted] = await Promise.all([
    count((qy) => qy.gte("created_at", `${todayPk}T00:00:00+05:00`)),
    count((qy) => qy.eq("action", "created")),
    count((qy) => qy.in("action", ["updated", "adjusted"])),
    count((qy) => qy.in("action", ["deleted", "voided"])),
  ]);
  return { today, created, updated, deleted };
}

/** Everything matching the filters, for the CSV export (capped, and says so). */
export async function getActivityForExport(filters = {}, limit = 5000) {
  if (isDemoMode) return (await getActivityPage({ ...filters, page: 1 })).rows;
  const supabase = await createClient();
  let query = supabase.from("activity_log").select("created_at, actor_name, action, module, record_label, summary");
  if (filters.user) query = query.eq("user_id", filters.user);
  if (filters.module) query = query.eq("module", filters.module);
  if (filters.action) query = query.eq("action", filters.action);
  if (filters.from) query = query.gte("created_at", `${filters.from}T00:00:00+05:00`);
  if (filters.to) query = query.lte("created_at", `${filters.to}T23:59:59.999+05:00`);
  if (filters.q) query = query.ilike("summary", `%${filters.q.replace(/[%_]/g, " ").trim()}%`);
  return unwrap(await query.order("created_at", { ascending: false }).limit(limit), "the activity log");
}

/** Low stock count for the header bell. */
export async function getLowStockAlerts() {
  if (isDemoMode) {
    return demo.demoItems.filter((r) => r.active && r.stock_status !== "in").slice(0, 8);
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("item_stock")
    .select("id, name, on_hand, unit, stock_status, kind")
    .eq("active", true)
    .in("stock_status", ["low", "out"])
    .order("stock_status", { ascending: false })
    .order("name")
    .limit(8);
  if (error) return [];
  return data ?? [];
}

// ---------------------------------------------------------------
// Suppliers
// ---------------------------------------------------------------

/** Active suppliers for pick lists. */
export async function getSupplierOptions() {
  if (isDemoMode) return demo.demoSuppliers.filter((s) => s.active).map(({ id, name }) => ({ id, name }));
  const supabase = await createClient();
  return unwrap(await supabase.from("suppliers").select("id, name").eq("active", true).order("name"), "the suppliers");
}

export async function getSupplier(id) {
  if (isDemoMode) return demo.demoSuppliers.find((s) => s.id === id) ?? null;
  const supabase = await createClient();
  return unwrap(await supabase.from("suppliers").select("*").eq("id", id).maybeSingle(), "the supplier");
}

/**
 * One page of suppliers. Admins get balances (supplier_balances); workers get
 * the plain list, because supplier payments are admin-only.
 */
export async function getSuppliersPage({ q, page, owing, isAdmin }) {
  if (isDemoMode) {
    const needle = (q || "").toLowerCase();
    const rows = demo.demoSupplierBalances
      .map((b) => ({ ...demo.demoSuppliers.find((s) => s.id === b.id), ...b }))
      .filter((r) => (!needle || `${r.name} ${r.phone}`.toLowerCase().includes(needle)) && (!owing || r.balance > 0))
      .sort((a, b) => a.name.localeCompare(b.name));
    return demoPage(rows, page);
  }
  const supabase = await createClient();
  const { from, to } = pageRange(page);
  let query = isAdmin
    ? supabase.from("supplier_balances").select("*", { count: "exact" })
    : supabase.from("suppliers").select("id, name, phone, active, contact_person", { count: "exact" });
  if (q) {
    const safe = q.replace(/[%,()]/g, " ").trim();
    if (safe) query = query.or(`name.ilike.%${safe}%,phone.ilike.%${safe}%`);
  }
  if (owing && isAdmin) query = query.gt("balance", 0);
  const { data, error, count } = await query.order("name").range(from, to);
  if (error) throw new Error(`Could not load the suppliers: ${error.message}`);
  return { rows: data ?? [], total: count ?? 0 };
}

export async function getSupplierTotals() {
  if (isDemoMode) {
    const rows = demo.demoSupplierBalances;
    return {
      suppliers: rows.filter((r) => r.active).length,
      payable: rows.filter((r) => r.balance > 0).reduce((t, r) => t + r.balance, 0),
      with_balance: rows.filter((r) => r.balance > 0).length,
    };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("supplier_totals");
  if (error) throw new Error(`Could not total the suppliers: ${error.message}`);
  return data?.[0] ?? { suppliers: 0, payable: 0, with_balance: 0 };
}

export async function getSupplierBalance(id) {
  if (isDemoMode) return demo.demoSupplierBalances.find((b) => b.id === id) ?? null;
  const supabase = await createClient();
  return unwrap(await supabase.from("supplier_balances").select("*").eq("id", id).maybeSingle(), "the supplier balance");
}

/** Running-balance ledger, worked out by supplier_ledger() in Postgres. */
export async function getSupplierLedger(id, { from, to } = {}) {
  if (isDemoMode) return demo.demoSupplierLedger(id, from || null, to || null);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("supplier_ledger", {
    p_supplier_id: id,
    p_from: from || null,
    p_to: to || null,
  });
  if (error) throw new Error(`Could not load the ledger: ${error.message}`);
  return data ?? [];
}

/** Every payment to a supplier, void ones included, newest first. */
export async function getSupplierPayments(supplierId) {
  if (isDemoMode) {
    return demo.demoSupplierPayments
      .filter((p) => p.supplier_id === supplierId)
      .map((p) => ({ ...p, purchase_no: demo.demoPurchases.find((x) => x.id === p.purchase_id)?.purchase_no ?? null }))
      .sort((a, b) => b.payment_date.localeCompare(a.payment_date) || b.created_at.localeCompare(a.created_at));
  }
  const supabase = await createClient();
  const data = unwrap(
    await supabase
      .from("supplier_payments")
      .select("*, purchases(purchase_no)")
      .eq("supplier_id", supplierId)
      .order("payment_date", { ascending: false })
      .order("created_at", { ascending: false }),
    "the payments",
  );
  return data.map((p) => ({ ...p, purchase_no: p.purchases?.purchase_no ?? null }));
}

/** Bills that still have something to pay, for the payment form's pick list. */
export async function getOpenPurchases(supplierId) {
  if (isDemoMode) {
    return demo.demoPurchases.filter((p) => p.supplier_id === supplierId && (p.payment_status === "unpaid" || p.payment_status === "partly"));
  }
  const supabase = await createClient();
  return unwrap(
    await supabase
      .from("purchase_list")
      .select("id, purchase_no, purchase_date, total, paid, payment_status")
      .eq("supplier_id", supplierId)
      .in("payment_status", ["unpaid", "partly"])
      .order("purchase_date"),
    "the unpaid bills",
  );
}

// ---------------------------------------------------------------
// Purchases
// ---------------------------------------------------------------

/** filters: { supplier, status, from, to, q, page } */
export async function getPurchasesPage(filters = {}) {
  const { supplier, status, from: dateFrom, to: dateTo, q, page } = filters;
  if (isDemoMode) {
    const needle = (q || "").toLowerCase();
    const rows = demo.demoPurchases.filter(
      (r) =>
        (!supplier || r.supplier_id === supplier) &&
        (!status || r.payment_status === status) &&
        (!dateFrom || r.purchase_date >= dateFrom) &&
        (!dateTo || r.purchase_date <= dateTo) &&
        (!needle || `${r.purchase_no} ${r.supplier_ref} ${r.supplier_name}`.toLowerCase().includes(needle)),
    );
    return demoPage(rows, page);
  }
  const supabase = await createClient();
  const { from, to } = pageRange(page);
  let query = supabase.from("purchase_list").select("*", { count: "exact" });
  if (supplier) query = query.eq("supplier_id", supplier);
  if (status) query = query.eq("payment_status", status);
  if (dateFrom) query = query.gte("purchase_date", dateFrom);
  if (dateTo) query = query.lte("purchase_date", dateTo);
  if (q) {
    const safe = q.replace(/[%,()]/g, " ").trim();
    if (safe) query = query.or(`purchase_no.ilike.%${safe}%,supplier_ref.ilike.%${safe}%,supplier_name.ilike.%${safe}%`);
  }
  const { data, error, count } = await query
    .order("purchase_date", { ascending: false })
    .order("purchase_no", { ascending: false })
    .range(from, to);
  if (error) throw new Error(`Could not load the purchases: ${error.message}`);
  return { rows: data ?? [], total: count ?? 0 };
}

/** Card totals over the given dates and supplier, from purchase_totals(). */
export async function getPurchaseTotals({ from, to, supplier } = {}) {
  if (isDemoMode) {
    const rows = demo.demoPurchases.filter(
      (r) => r.status === "posted" && (!from || r.purchase_date >= from) && (!to || r.purchase_date <= to) && (!supplier || r.supplier_id === supplier),
    );
    const total = rows.reduce((t, r) => t + r.total, 0);
    const paid = rows.reduce((t, r) => t + Math.min(r.paid, r.total), 0);
    return { bills: rows.length, total, paid, unpaid: Math.max(total - paid, 0) };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("purchase_totals", { p_from: from || null, p_to: to || null, p_supplier: supplier || null });
  if (error) throw new Error(`Could not total the purchases: ${error.message}`);
  return data?.[0] ?? { bills: 0, total: 0, paid: 0, unpaid: 0 };
}

/** A purchase with its lines, and its payments when the reader is an admin. */
export async function getPurchase(id, { withPayments = false } = {}) {
  if (isDemoMode) {
    const purchase = demo.demoPurchases.find((p) => p.id === id);
    if (!purchase) return null;
    return {
      purchase,
      lines: demo.demoPurchaseLines.filter((l) => l.purchase_id === id),
      payments: withPayments ? demo.demoSupplierPayments.filter((p) => p.purchase_id === id) : [],
    };
  }
  const supabase = await createClient();
  const purchase = unwrap(await supabase.from("purchase_list").select("*").eq("id", id).maybeSingle(), "the purchase");
  if (!purchase) return null;
  const [linesRes, creatorRes, paymentsRes] = await Promise.all([
    supabase.from("purchase_lines").select("id, item_id, qty, rate, amount, items(name, code, brand_id, units(short_name), brands(name))").eq("purchase_id", id),
    purchase.created_by ? supabase.from("profiles").select("full_name").eq("id", purchase.created_by).maybeSingle() : { data: null },
    withPayments
      ? supabase.from("supplier_payments").select("*").eq("purchase_id", id).order("payment_date")
      : { data: [] },
  ]);
  const lines = unwrap(linesRes, "the purchase lines").map((l) => ({
    ...l,
    item_name: l.items?.name ?? "",
    unit: l.items?.units?.short_name ?? "",
    brand_name: l.items?.brands?.name ?? null,
  }));
  return {
    purchase: { ...purchase, created_by_name: creatorRes.data?.full_name ?? "" },
    lines,
    payments: paymentsRes.data ?? [],
  };
}

// ---------------------------------------------------------------
// Production
// ---------------------------------------------------------------

/** filters: { item, status, from, to, q, page } */
export async function getProductionPage(filters = {}) {
  const { item, status, from: dateFrom, to: dateTo, q, page } = filters;
  if (isDemoMode) {
    const needle = (q || "").toLowerCase();
    const rows = demo.demoProductionRuns.filter(
      (r) =>
        (!item || r.item_id === item) &&
        (!status || (status === "over" ? r.over_recipe > 0 && r.status === "posted" : r.status === status)) &&
        (!dateFrom || r.run_date >= dateFrom) &&
        (!dateTo || r.run_date <= dateTo) &&
        (!needle || `${r.run_no} ${r.item_name} ${r.item_code ?? ""}`.toLowerCase().includes(needle)),
    );
    return demoPage(rows, page);
  }
  const supabase = await createClient();
  const { from, to } = pageRange(page);
  let query = supabase.from("production_list").select("*", { count: "exact" });
  if (item) query = query.eq("item_id", item);
  if (status === "over") query = query.eq("status", "posted").gt("over_recipe", 0);
  else if (status) query = query.eq("status", status);
  if (dateFrom) query = query.gte("run_date", dateFrom);
  if (dateTo) query = query.lte("run_date", dateTo);
  if (q) {
    const safe = q.replace(/[%,()]/g, " ").trim();
    if (safe) query = query.or(`run_no.ilike.%${safe}%,item_name.ilike.%${safe}%,item_code.ilike.%${safe}%`);
  }
  const { data, error, count } = await query
    .order("run_date", { ascending: false })
    .order("run_no", { ascending: false })
    .range(from, to);
  if (error) throw new Error(`Could not load the production runs: ${error.message}`);
  return { rows: data ?? [], total: count ?? 0 };
}

/** { runs, products, made: [{ unit, qty }] } from production_totals(). */
export async function getProductionTotals({ from, to, item } = {}) {
  if (isDemoMode) {
    const rows = demo.demoProductionRuns.filter(
      (r) => r.status === "posted" && (!from || r.run_date >= from) && (!to || r.run_date <= to) && (!item || r.item_id === item),
    );
    const byUnit = {};
    rows.forEach((r) => {
      byUnit[r.unit] = (byUnit[r.unit] ?? 0) + r.qty_made;
    });
    return {
      runs: rows.length,
      products: new Set(rows.map((r) => r.item_id)).size,
      made: Object.entries(byUnit).map(([unit, qty]) => ({ unit, qty })).sort((a, b) => b.qty - a.qty),
    };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("production_totals", { p_from: from || null, p_to: to || null, p_item: item || null });
  if (error) throw new Error(`Could not total the production: ${error.message}`);
  return data ?? { runs: 0, products: 0, made: [] };
}

/** A run with the materials it used: expected (recipe) and actual. */
export async function getProductionRun(id) {
  if (isDemoMode) {
    const run = demo.demoProductionRuns.find((r) => r.id === id);
    if (!run) return null;
    return { run, materials: demo.demoProductionConsumption.filter((c) => c.run_id === id) };
  }
  const supabase = await createClient();
  const run = unwrap(await supabase.from("production_list").select("*").eq("id", id).maybeSingle(), "the production run");
  if (!run) return null;
  const rows = unwrap(
    await supabase
      .from("production_consumption")
      .select("id, raw_item_id, qty, expected_qty, items(name, units(short_name))")
      .eq("run_id", id),
    "the materials used",
  );
  return {
    run,
    materials: rows.map((m) => ({ ...m, item_name: m.items?.name ?? "", unit: m.items?.units?.short_name ?? "" })),
  };
}

/** Every product's recipe in one go: { [item_id]: { notes, lines } }. */
export async function getRecipesForProducts() {
  if (isDemoMode) return demo.demoRecipes;
  const supabase = await createClient();
  const data = unwrap(await supabase.from("recipes").select("item_id, notes, recipe_lines(raw_item_id, qty_per_unit)"), "the recipes");
  return Object.fromEntries(data.map((r) => [r.item_id, { notes: r.notes, lines: r.recipe_lines ?? [] }]));
}
