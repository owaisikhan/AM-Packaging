"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "./supabase-server";
import { createAdminClient } from "./supabase-auth";
import { requireRole, ROLES } from "./helpers";
import { isDemoMode } from "./config";

// Every write lives in this file. Each action returns { ok, message, ...extras }
// so one <FormMessage> renders them all.

const ok = (message, extras = {}) => ({ ok: true, message, ...extras });
const fail = (message) => ({ ok: false, message });

function text(formData, field) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function number(formData, field) {
  const raw = text(formData, field).replace(/,/g, "");
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
}

function idOrNull(formData, field) {
  const v = text(formData, field);
  return v === "" ? null : v;
}

/**
 * Database errors are mostly written as sentences already (see the
 * migrations). This maps the few that surface as raw constraint names.
 */
function describe(error, fallback) {
  if (!error) return fallback;
  const message = error.message ?? String(error);
  if (message.includes("items_code_key")) return "Another item already uses that code. Pick a different code.";
  if (message.includes("sizes_width_mm_length_yd_key")) return "That size already exists.";
  if (message.includes("microns_value_key")) return "That micron already exists.";
  if (message.includes("_name_key")) return "That name is already in the list.";
  if (message.includes("violates foreign key constraint")) {
    return "This is still used by items or entries, so it cannot be deleted. Mark it inactive instead.";
  }
  if (message.includes("row-level security")) return "You do not have permission to do this. Ask an admin.";
  return message || fallback;
}

async function guard(role) {
  try {
    return { user: await requireRole(role) };
  } catch (error) {
    return { error: fail(error.message) };
  }
}

// ---------------------------------------------------------------
// Sign in and out
// ---------------------------------------------------------------
export async function signIn(_prev, formData) {
  if (isDemoMode) redirect("/admin");

  const email = text(formData, "email").toLowerCase();
  const password = text(formData, "password");
  const next = text(formData, "next");
  if (!email || !password) return fail("Enter your email and password.");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return fail("That email and password do not match. Check them and try again.");

  const { data: profile } = await supabase.from("profiles").select("active").eq("id", data.user.id).maybeSingle();
  if (!profile || !profile.active) {
    await supabase.auth.signOut();
    return fail("This account has been switched off. Ask an admin to turn it back on.");
  }

  await supabase.rpc("log_event", { p_action: "login" });
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function signOut() {
  if (!isDemoMode) {
    const supabase = await createClient();
    await supabase.rpc("log_event", { p_action: "logout" });
    await supabase.auth.signOut();
  }
  redirect("/login");
}

// ---------------------------------------------------------------
// Items (raw materials and products)
// ---------------------------------------------------------------
export async function saveItem(_prev, formData) {
  const { error: denied } = await guard(ROLES.ADMIN);
  if (denied) return denied;

  const id = text(formData, "id");
  const kind = text(formData, "kind");
  const name = text(formData, "name");
  const categoryId = idOrNull(formData, "category_id");
  const unitId = idOrNull(formData, "unit_id");
  const low = number(formData, "low_stock_level");
  const rate = number(formData, "default_rate");
  const rolls = number(formData, "rolls_per_carton");

  if (kind !== "raw" && kind !== "finished") return fail("Choose whether this is a raw material or a product.");
  if (!name) return fail("Enter a name for the item.");
  if (!categoryId) return fail("Pick a category.");
  if (!unitId) return fail("Pick the unit this item is counted in.");
  if (Number.isNaN(low) || (low !== null && low < 0)) return fail("The low-stock level must be zero or more.");
  if (Number.isNaN(rate) || (rate !== null && rate < 0)) return fail("The rate must be zero or more.");
  if (Number.isNaN(rolls) || (rolls !== null && (rolls <= 0 || !Number.isInteger(rolls)))) {
    return fail("Rolls per carton must be a whole number above zero, or left empty.");
  }

  const row = {
    kind,
    name,
    code: text(formData, "code") || null,
    category_id: categoryId,
    unit_id: unitId,
    brand_id: idOrNull(formData, "brand_id"),
    size_id: idOrNull(formData, "size_id"),
    micron_id: idOrNull(formData, "micron_id"),
    color_id: idOrNull(formData, "color_id"),
    rolls_per_carton: rolls,
    low_stock_level: low ?? 0,
    default_rate: rate ?? 0,
    notes: text(formData, "notes"),
  };

  const supabase = await createClient();
  const { data, error } = id
    ? await supabase.from("items").update(row).eq("id", id).select("id").single()
    : await supabase.from("items").insert(row).select("id").single();

  if (error) return fail(describe(error, "Could not save the item."));

  const base = kind === "raw" ? "/admin/raw-materials" : "/admin/products";
  revalidatePath(base);
  revalidatePath("/admin/stock");
  return ok(id ? `${name} updated.` : `${name} added.`, { id: data.id });
}

export async function setItemActive(_prev, formData) {
  const { error: denied } = await guard(ROLES.ADMIN);
  if (denied) return denied;
  const id = text(formData, "id");
  const active = text(formData, "active") === "true";
  const supabase = await createClient();
  const { error } = await supabase.from("items").update({ active }).eq("id", id);
  if (error) return fail(describe(error, "Could not update the item."));
  revalidatePath("/admin", "layout");
  return ok(active ? "Item turned back on." : "Item hidden from lists. Its history is kept.");
}

// ---------------------------------------------------------------
// Opening stock and adjustments (admin)
// ---------------------------------------------------------------
export async function adjustStock(_prev, formData) {
  const { error: denied } = await guard(ROLES.ADMIN);
  if (denied) return denied;

  const itemId = text(formData, "item_id");
  const type = text(formData, "type");
  const direction = text(formData, "direction"); // "add" | "remove" (adjustments only)
  const qty = number(formData, "qty");
  const note = text(formData, "note");
  const date = text(formData, "movement_date") || null;

  if (!itemId) return fail("Pick an item.");
  if (type !== "opening" && type !== "adjustment") return fail("Choose opening stock or an adjustment.");
  if (qty === null || Number.isNaN(qty) || qty <= 0) return fail("Enter a quantity above zero.");
  if (type === "adjustment" && !note) return fail("Write a reason for this adjustment.");

  const signed = type === "adjustment" && direction === "remove" ? -qty : qty;

  const supabase = await createClient();
  const { error } = await supabase.rpc("adjust_stock", {
    p_item_id: itemId,
    p_qty: signed,
    p_type: type,
    p_note: note,
    p_date: date,
  });
  if (error) return fail(describe(error, "Could not save the stock entry."));

  revalidatePath("/admin", "layout");
  return ok(type === "opening" ? "Opening stock saved." : "Stock adjusted.");
}

// ---------------------------------------------------------------
// Settings: lookup lists (brands, sizes, microns, colors, units, categories)
// ---------------------------------------------------------------
const LOOKUPS = {
  brands: { label: "brand", fields: ["name"] },
  colors: { label: "color/type", fields: ["name"] },
  units: { label: "unit", fields: ["name", "short_name"] },
  item_categories: { label: "category", fields: ["name", "kind"] },
  sizes: { label: "size", fields: ["width_mm", "length_yd"], numeric: ["width_mm", "length_yd"] },
  microns: { label: "micron", fields: ["value"], numeric: ["value"] },
};

export async function saveLookup(_prev, formData) {
  const { error: denied } = await guard(ROLES.ADMIN);
  if (denied) return denied;

  const table = text(formData, "table");
  const spec = LOOKUPS[table];
  if (!spec) return fail("Unknown list.");

  const id = text(formData, "id");
  const row = {};
  for (const f of spec.fields) {
    if (spec.numeric?.includes(f)) {
      const n = number(formData, f);
      if (n === null || Number.isNaN(n) || n <= 0) return fail("Enter numbers above zero.");
      row[f] = n;
    } else {
      const v = text(formData, f);
      if (!v) return fail(`Fill in every field for the ${spec.label}.`);
      row[f] = v;
    }
  }
  if (table === "item_categories" && !["raw", "finished"].includes(row.kind)) {
    return fail("Choose whether the category is for raw materials or products.");
  }

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from(table).update(row).eq("id", id)
    : await supabase.from(table).insert(row);
  if (error) return fail(describe(error, `Could not save the ${spec.label}.`));

  revalidatePath("/admin", "layout");
  return ok(id ? `${spec.label[0].toUpperCase()}${spec.label.slice(1)} updated.` : `${spec.label[0].toUpperCase()}${spec.label.slice(1)} added.`);
}

export async function deleteLookup(_prev, formData) {
  const { error: denied } = await guard(ROLES.ADMIN);
  if (denied) return denied;
  const table = text(formData, "table");
  const spec = LOOKUPS[table];
  if (!spec) return fail("Unknown list.");
  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq("id", text(formData, "id"));
  if (error) return fail(describe(error, `Could not delete the ${spec.label}.`));
  revalidatePath("/admin", "layout");
  return ok(`${spec.label[0].toUpperCase()}${spec.label.slice(1)} deleted.`);
}

/** Quick add from an item form ("unit not in the list? add it here"). */
export async function quickAddUnit(name, shortName) {
  try {
    await requireRole(ROLES.ADMIN);
  } catch (error) {
    return fail(error.message);
  }
  const n = String(name ?? "").trim();
  const s = String(shortName ?? "").trim();
  if (!n || !s) return fail("Enter the unit's name and its short form, for example Kilogram and kg.");
  const supabase = await createClient();
  const { data, error } = await supabase.from("units").insert({ name: n, short_name: s }).select("id, name, short_name").single();
  if (error) return fail(describe(error, "Could not add the unit."));
  revalidatePath("/admin", "layout");
  return ok(`Unit ${n} added.`, { unit: data });
}

// ---------------------------------------------------------------
// Settings: company and invoice
// ---------------------------------------------------------------
export async function saveSettings(_prev, formData) {
  const { error: denied } = await guard(ROLES.ADMIN);
  if (denied) return denied;

  const gstRate = number(formData, "gst_rate");
  if (gstRate === null || Number.isNaN(gstRate) || gstRate < 0 || gstRate > 100) {
    return fail("The GST rate must be between 0 and 100.");
  }
  const companyName = text(formData, "company_name");
  if (!companyName) return fail("Enter the company name.");

  const row = {
    company_name: companyName,
    short_name: text(formData, "short_name") || companyName,
    tagline: text(formData, "tagline"),
    address: text(formData, "address"),
    phone: text(formData, "phone"),
    email: text(formData, "email"),
    ntn: text(formData, "ntn"),
    strn: text(formData, "strn"),
    logo_url: text(formData, "logo_url"),
    gst_enabled: formData.get("gst_enabled") === "on",
    gst_rate: gstRate,
    invoice_prefix: text(formData, "invoice_prefix"),
    purchase_prefix: text(formData, "purchase_prefix"),
    production_prefix: text(formData, "production_prefix"),
    invoice_terms: text(formData, "invoice_terms"),
    invoice_footer: text(formData, "invoice_footer"),
    updated_at: new Date().toISOString(),
  };

  const supabase = await createClient();
  const { error } = await supabase.from("settings").update(row).eq("id", 1);
  if (error) return fail(describe(error, "Could not save the settings."));
  revalidatePath("/admin", "layout");
  return ok("Settings saved.");
}

// ---------------------------------------------------------------
// Recipes (admin)
// ---------------------------------------------------------------
export async function saveRecipe(_prev, formData) {
  const { error: denied } = await guard(ROLES.ADMIN);
  if (denied) return denied;

  const itemId = text(formData, "item_id");
  if (!itemId) return fail("Pick the product this recipe is for.");

  const ids = formData.getAll("raw_item_id").map(String);
  const qtys = formData.getAll("qty_per_unit").map((v) => Number(String(v).replace(/,/g, "")));
  const lines = [];
  const seen = new Set();
  for (let i = 0; i < ids.length; i += 1) {
    if (!ids[i] && !qtys[i]) continue;
    if (!ids[i]) return fail("One row has a quantity but no material. Pick a material or clear the row.");
    if (!Number.isFinite(qtys[i]) || qtys[i] <= 0) return fail("Every material needs a quantity above zero.");
    if (seen.has(ids[i])) return fail("The same material is listed twice. Combine the rows into one.");
    seen.add(ids[i]);
    lines.push({ raw_item_id: ids[i], qty_per_unit: qtys[i] });
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_recipe", {
    p_item_id: itemId,
    p_lines: lines,
    p_notes: text(formData, "notes"),
  });
  if (error) return fail(describe(error, "Could not save the recipe."));
  revalidatePath("/admin/settings");
  revalidatePath("/admin/products");
  return ok(lines.length ? "Recipe saved." : "Recipe cleared. Production of this product will start with an empty materials list.");
}

// ---------------------------------------------------------------
// Users (admin). Sign-in accounts need the service-role client; the
// profile row is written with the admin's own session so the activity log
// records who did it.
// ---------------------------------------------------------------
export async function createUser(_prev, formData) {
  const { error: denied } = await guard(ROLES.ADMIN);
  if (denied) return denied;

  const fullName = text(formData, "full_name");
  const email = text(formData, "email").toLowerCase();
  const password = text(formData, "password");
  const role = text(formData, "role");

  if (!fullName) return fail("Enter the person's name.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail("Enter a valid email address. It is what they sign in with.");
  if (password.length < 8) return fail("The password must be at least 8 characters.");
  if (role !== "admin" && role !== "worker") return fail("Choose admin or worker.");

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) {
    return fail(
      error.message?.toLowerCase().includes("already")
        ? "Someone already signs in with that email."
        : `Could not create the sign-in: ${error.message}`,
    );
  }

  const supabase = await createClient();
  const { error: profileError } = await supabase
    .from("profiles")
    .insert({ id: data.user.id, full_name: fullName, role, active: true });
  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return fail(describe(profileError, "Could not save the user."));
  }

  revalidatePath("/admin/users");
  return ok(`${fullName} can now sign in with ${email}.`);
}

export async function updateUser(_prev, formData) {
  const { user: me, error: denied } = await guard(ROLES.ADMIN);
  if (denied) return denied;

  const id = text(formData, "id");
  const fullName = text(formData, "full_name");
  const role = text(formData, "role");
  const active = text(formData, "active") !== "false";
  const password = text(formData, "password");

  if (!fullName) return fail("Enter the person's name.");
  if (role !== "admin" && role !== "worker") return fail("Choose admin or worker.");
  if (id === me.id && (role !== "admin" || !active)) {
    return fail("You cannot remove your own admin access or switch yourself off. Ask the other admin.");
  }
  if (password && password.length < 8) return fail("The new password must be at least 8 characters.");

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ full_name: fullName, role, active }).eq("id", id);
  if (error) return fail(describe(error, "Could not update the user."));

  if (password) {
    const admin = createAdminClient();
    const { error: pwError } = await admin.auth.admin.updateUserById(id, { password });
    if (pwError) return fail(`Details saved, but the password was not changed: ${pwError.message}`);
  }

  revalidatePath("/admin/users");
  return ok(password ? `${fullName} updated, with a new password.` : `${fullName} updated.`);
}
