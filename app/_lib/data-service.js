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
  if (isDemoMode) {
    if (itemId !== "i-t-46-72-40c") return null;
    return {
      notes: "Standard pack",
      lines: [
        { raw_item_id: "i-cb-46", qty_per_unit: 1 },
        { raw_item_id: "i-jr-40c", qty_per_unit: 3950 },
        { raw_item_id: "i-pt-star", qty_per_unit: 72 },
        { raw_item_id: "i-sf", qty_per_unit: 0.15 },
      ],
    };
  }
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
