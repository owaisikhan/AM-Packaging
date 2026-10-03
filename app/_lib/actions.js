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

// ---------------------------------------------------------------
// Purchases
// ---------------------------------------------------------------
function moneyField(formData, field) {
  const n = number(formData, field);
  return n === null ? 0 : n;
}

/** Collects the line rows the purchase and sale forms post as parallel arrays. */
function collectLines(formData) {
  const ids = formData.getAll("line_item_id").map(String);
  const qtys = formData.getAll("line_qty").map((v) => String(v).replace(/,/g, "").trim());
  const rates = formData.getAll("line_rate").map((v) => String(v).replace(/,/g, "").trim());
  const lines = [];
  for (let i = 0; i < ids.length; i += 1) {
    if (!ids[i] && !qtys[i] && !rates[i]) continue; // an empty row left at the bottom
    if (!ids[i]) return { error: `Row ${i + 1} has no item. Pick an item or remove the row.` };
    const qty = Number(qtys[i]);
    const rate = Number(rates[i] === "" ? NaN : rates[i]);
    if (!Number.isFinite(qty) || qty <= 0) return { error: `Row ${i + 1} needs a quantity above zero.` };
    if (!Number.isFinite(rate) || rate < 0) return { error: `Row ${i + 1} needs a rate of zero or more.` };
    lines.push({ item_id: ids[i], qty, rate });
  }
  if (lines.length === 0) return { error: "Add at least one item." };
  return { lines };
}

export async function createPurchase(_prev, formData) {
  const { user, error: denied } = await guard(ROLES.WORKER);
  if (denied) return denied;

  const supplierId = text(formData, "supplier_id");
  if (!supplierId) return fail("Pick the supplier.");
  const { lines, error: lineError } = collectLines(formData);
  if (lineError) return fail(lineError);

  const discount = moneyField(formData, "discount");
  const other = moneyField(formData, "other_charges");
  const gstOn = formData.get("gst_enabled") === "on";
  const gstRate = gstOn ? moneyField(formData, "gst_rate") : 0;
  if ([discount, other, gstRate].some((n) => Number.isNaN(n) || n < 0)) {
    return fail("Discount, other charges and GST must be numbers of zero or more.");
  }
  const paid = user.role === ROLES.ADMIN ? moneyField(formData, "amount_paid") : 0;
  if (Number.isNaN(paid) || paid < 0) return fail("The amount paid must be zero or more.");

  const supabase = await createClient();
  const { data: id, error } = await supabase.rpc("post_purchase", {
    p: {
      supplier_id: supplierId,
      purchase_date: text(formData, "purchase_date") || null,
      supplier_ref: text(formData, "supplier_ref"),
      discount,
      gst_rate: gstRate,
      other_charges: other,
      notes: text(formData, "notes"),
      lines,
      payment: paid > 0 ? { amount: paid, method: text(formData, "payment_method") || "cash", reference: text(formData, "payment_reference") } : null,
    },
  });
  if (error) return fail(describe(error, "Could not save the purchase."));

  revalidatePath("/admin", "layout");
  redirect(`/admin/purchases/${id}?saved=1`);
}

export async function voidPurchase(_prev, formData) {
  const { error: denied } = await guard(ROLES.ADMIN);
  if (denied) return denied;
  const id = text(formData, "id");
  const reason = text(formData, "reason");
  if (!reason) return fail("Write a reason for voiding this purchase.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("void_purchase", { p_id: id, p_reason: reason });
  if (error) return fail(describe(error, "Could not void the purchase."));
  revalidatePath("/admin", "layout");
  return ok("Purchase voided. Its stock has been taken back out and any payments on it are void.");
}

// ---------------------------------------------------------------
// Suppliers and supplier payments
// ---------------------------------------------------------------
export async function saveSupplier(_prev, formData) {
  const id = text(formData, "id");
  // Anyone signed in can add a supplier; changing one is for admins (RLS agrees).
  const { user, error: denied } = await guard(id ? ROLES.ADMIN : ROLES.WORKER);
  if (denied) return denied;

  const name = text(formData, "name");
  if (!name) return fail("Enter the supplier's name.");
  const opening = number(formData, "opening_balance");
  if (Number.isNaN(opening)) return fail("The opening balance must be a number, for example 25000 or 0.");

  const row = {
    name,
    contact_person: text(formData, "contact_person"),
    phone: text(formData, "phone"),
    address: text(formData, "address"),
    notes: text(formData, "notes"),
  };
  // Workers adding a supplier cannot set money owed; an admin enters it.
  if (user.role === ROLES.ADMIN) row.opening_balance = opening ?? 0;
  if (id && formData.has("active")) row.active = text(formData, "active") !== "false";

  const supabase = await createClient();
  const { data, error } = id
    ? await supabase.from("suppliers").update(row).eq("id", id).select("id").single()
    : await supabase.from("suppliers").insert(row).select("id").single();
  if (error) return fail(describe(error, "Could not save the supplier."));

  revalidatePath("/admin/suppliers");
  revalidatePath("/admin/purchases/new");
  return ok(id ? `${name} updated.` : `${name} added.`, { id: data.id });
}

export async function recordSupplierPayment(_prev, formData) {
  const { error: denied } = await guard(ROLES.ADMIN);
  if (denied) return denied;
  const amount = number(formData, "amount");
  if (amount === null || Number.isNaN(amount) || amount <= 0) return fail("Enter the amount paid, above zero.");

  const supplierId = text(formData, "supplier_id");
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_supplier_payment", {
    p: {
      supplier_id: supplierId,
      purchase_id: text(formData, "purchase_id") || null,
      payment_date: text(formData, "payment_date") || null,
      amount,
      method: text(formData, "method") || "cash",
      reference: text(formData, "reference"),
      note: text(formData, "note"),
    },
  });
  if (error) return fail(describe(error, "Could not save the payment."));
  revalidatePath("/admin/suppliers", "layout");
  revalidatePath("/admin/purchases", "layout");
  return ok(`Payment of Rs ${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 2 }).format(amount)} saved.`);
}

export async function voidSupplierPayment(_prev, formData) {
  const { error: denied } = await guard(ROLES.ADMIN);
  if (denied) return denied;
  const reason = text(formData, "reason");
  if (!reason) return fail("Write a reason for voiding this payment.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("void_supplier_payment", { p_id: text(formData, "id"), p_reason: reason });
  if (error) return fail(describe(error, "Could not void the payment."));
  revalidatePath("/admin/suppliers", "layout");
  revalidatePath("/admin/purchases", "layout");
  return ok("Payment voided. The supplier's balance has gone back up by that amount.");
}

// ---------------------------------------------------------------
// Production
// ---------------------------------------------------------------
export async function createProduction(_prev, formData) {
  const { error: denied } = await guard(ROLES.WORKER);
  if (denied) return denied;

  const itemId = text(formData, "item_id");
  if (!itemId) return fail("Pick the product that was made.");
  const qtyMade = number(formData, "qty_made");
  if (qtyMade === null || Number.isNaN(qtyMade) || qtyMade <= 0) return fail("Enter how many were made, above zero.");

  const ids = formData.getAll("material_id").map(String);
  const qtys = formData.getAll("material_qty").map((v) => String(v).replace(/,/g, "").trim());
  const materials = [];
  const seen = new Set();
  for (let i = 0; i < ids.length; i += 1) {
    if (!ids[i] && !qtys[i]) continue;
    if (!ids[i]) return fail(`Material row ${i + 1} has no material. Pick one or remove the row.`);
    const qty = Number(qtys[i]);
    if (!Number.isFinite(qty) || qty <= 0) return fail(`Material row ${i + 1} needs a quantity above zero, or remove the row if it was not used.`);
    if (seen.has(ids[i])) return fail("The same raw material is listed twice. Combine those rows into one.");
    seen.add(ids[i]);
    materials.push({ item_id: ids[i], qty });
  }
  if (materials.length === 0) return fail("Add the raw materials used for this run.");

  const supabase = await createClient();
  const { data: id, error } = await supabase.rpc("post_production", {
    p: {
      item_id: itemId,
      qty_made: qtyMade,
      run_date: text(formData, "run_date") || null,
      notes: text(formData, "notes"),
      materials,
    },
  });
  if (error) return fail(describe(error, "Could not save the production run."));

  revalidatePath("/admin", "layout");
  redirect(`/admin/production/${id}?saved=1`);
}

export async function voidProduction(_prev, formData) {
  const { error: denied } = await guard(ROLES.ADMIN);
  if (denied) return denied;
  const reason = text(formData, "reason");
  if (!reason) return fail("Write a reason for voiding this production run.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("void_production", { p_id: text(formData, "id"), p_reason: reason });
  if (error) return fail(describe(error, "Could not void the production run."));
  revalidatePath("/admin", "layout");
  return ok("Run voided. The raw materials are back in stock and the finished goods have been taken out.");
}

// ---------------------------------------------------------------
// Sales and customers
// ---------------------------------------------------------------
export async function createSale(_prev, formData) {
  const { error: denied } = await guard(ROLES.WORKER);
  if (denied) return denied;

  const customerId = text(formData, "customer_id");
  if (!customerId) return fail("Pick the customer.");
  const { lines, error: lineError } = collectLines(formData);
  if (lineError) return fail(lineError);

  const discount = moneyField(formData, "discount");
  const other = moneyField(formData, "other_charges");
  const gstOn = formData.get("gst_enabled") === "on";
  const gstRate = gstOn ? moneyField(formData, "gst_rate") : 0;
  if ([discount, other, gstRate].some((n) => Number.isNaN(n) || n < 0)) {
    return fail("Discount, other charges and GST must be numbers of zero or more.");
  }
  // Workers may take cash at the counter; post_sale records it for them.
  const received = moneyField(formData, "amount_received");
  if (Number.isNaN(received) || received < 0) return fail("The amount received must be zero or more.");

  const saleDate = text(formData, "sale_date") || null;
  const dueDate = text(formData, "due_date") || null;
  if (saleDate && dueDate && dueDate < saleDate) return fail("The due date cannot be before the invoice date.");

  const supabase = await createClient();
  const { data: id, error } = await supabase.rpc("post_sale", {
    p: {
      customer_id: customerId,
      sale_date: saleDate,
      due_date: dueDate,
      discount,
      gst_rate: gstRate,
      other_charges: other,
      notes: text(formData, "notes"),
      lines,
      payment: received > 0 ? { amount: received, method: text(formData, "payment_method") || "cash", reference: text(formData, "payment_reference") } : null,
    },
  });
  if (error) return fail(describe(error, "Could not save the invoice."));

  revalidatePath("/admin", "layout");
  redirect(`/admin/sales/${id}?saved=1`);
}

export async function voidSale(_prev, formData) {
  const { error: denied } = await guard(ROLES.ADMIN);
  if (denied) return denied;
  const reason = text(formData, "reason");
  if (!reason) return fail("Write a reason for voiding this invoice.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("void_sale", { p_id: text(formData, "id"), p_reason: reason });
  if (error) return fail(describe(error, "Could not void the invoice."));
  revalidatePath("/admin", "layout");
  return ok("Invoice voided. Its products are back in stock and any payments on it are void.");
}

export async function saveCustomer(_prev, formData) {
  const id = text(formData, "id");
  // Anyone signed in can add a customer; changing one is for admins (RLS agrees).
  const { user, error: denied } = await guard(id ? ROLES.ADMIN : ROLES.WORKER);
  if (denied) return denied;

  const name = text(formData, "name");
  if (!name) return fail("Enter the customer's name.");
  const opening = number(formData, "opening_balance");
  if (Number.isNaN(opening)) return fail("The opening balance must be a number, for example 25000 or 0.");

  const row = {
    name,
    contact_person: text(formData, "contact_person"),
    phone: text(formData, "phone"),
    address: text(formData, "address"),
    ntn: text(formData, "ntn"),
    notes: text(formData, "notes"),
  };
  // Workers adding a customer cannot set money owed; an admin enters it.
  if (user.role === ROLES.ADMIN) row.opening_balance = opening ?? 0;
  if (id && formData.has("active")) row.active = text(formData, "active") !== "false";

  const supabase = await createClient();
  const { data, error } = id
    ? await supabase.from("customers").update(row).eq("id", id).select("id").single()
    : await supabase.from("customers").insert(row).select("id").single();
  if (error) return fail(describe(error, "Could not save the customer."));

  revalidatePath("/admin/customers");
  revalidatePath("/admin/sales/new");
  return ok(id ? `${name} updated.` : `${name} added.`, { id: data.id });
}

export async function recordCustomerPayment(_prev, formData) {
  const { error: denied } = await guard(ROLES.ADMIN);
  if (denied) return denied;
  const amount = number(formData, "amount");
  if (amount === null || Number.isNaN(amount) || amount <= 0) return fail("Enter the amount received, above zero.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("record_customer_payment", {
    p: {
      customer_id: text(formData, "customer_id"),
      sale_id: text(formData, "sale_id") || null,
      payment_date: text(formData, "payment_date") || null,
      amount,
      method: text(formData, "method") || "cash",
      reference: text(formData, "reference"),
      note: text(formData, "note"),
    },
  });
  if (error) return fail(describe(error, "Could not save the payment."));
  revalidatePath("/admin/customers", "layout");
  revalidatePath("/admin/sales", "layout");
  return ok(`Payment of Rs ${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 2 }).format(amount)} received and saved.`);
}

export async function voidCustomerPayment(_prev, formData) {
  const { error: denied } = await guard(ROLES.ADMIN);
  if (denied) return denied;
  const reason = text(formData, "reason");
  if (!reason) return fail("Write a reason for voiding this payment.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("void_customer_payment", { p_id: text(formData, "id"), p_reason: reason });
  if (error) return fail(describe(error, "Could not void the payment."));
  revalidatePath("/admin/customers", "layout");
  revalidatePath("/admin/sales", "layout");
  return ok("Payment voided. The customer's balance has gone back up by that amount.");
}
