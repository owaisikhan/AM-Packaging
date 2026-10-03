// Sample data for demo mode only (no database connected). Shaped exactly like
// the rows the real queries return, so the same components render both.
// Never used once NEXT_PUBLIC_SUPABASE_URL is set.

export const demoProfile = {
  id: "demo-admin",
  full_name: "Ahmed Munir",
  role: "admin",
  active: true,
  email: "admin@ampackaging.pk",
};

export const demoProfiles = [
  { id: "demo-admin", full_name: "Ahmed Munir", role: "admin", active: true, email: "admin@ampackaging.pk", created_at: "2026-09-01T05:00:00Z" },
  { id: "demo-admin-2", full_name: "Usman Ahmed", role: "admin", active: true, email: "usman@ampackaging.pk", created_at: "2026-09-01T05:10:00Z" },
  { id: "demo-w1", full_name: "Ali Raza", role: "worker", active: true, email: "ali@ampackaging.pk", created_at: "2026-09-02T06:00:00Z" },
  { id: "demo-w2", full_name: "Muhammad Bilal Hussain", role: "worker", active: true, email: "bilal@ampackaging.pk", created_at: "2026-09-02T06:05:00Z" },
  { id: "demo-w3", full_name: "Imran Khan", role: "worker", active: false, email: "imran@ampackaging.pk", created_at: "2026-09-03T06:00:00Z" },
];

export const demoCategories = [
  { id: "cat-jumbo", name: "Jumbo Roll", kind: "raw", active: true, sort_order: 1 },
  { id: "cat-tube", name: "Paper Tube", kind: "raw", active: true, sort_order: 2 },
  { id: "cat-box", name: "Carton Box", kind: "raw", active: true, sort_order: 3 },
  { id: "cat-film", name: "Shrink Film", kind: "raw", active: true, sort_order: 4 },
  { id: "cat-granules", name: "Granules", kind: "raw", active: true, sort_order: 5 },
  { id: "cat-tape", name: "Tape Carton", kind: "finished", active: true, sort_order: 1 },
  { id: "cat-stretch", name: "Stretch Film", kind: "finished", active: true, sort_order: 2 },
  { id: "cat-strip", name: "Plastic Strip", kind: "finished", active: true, sort_order: 3 },
];

export const demoUnits = [
  { id: "u-pcs", name: "Pieces", short_name: "pcs" },
  { id: "u-kg", name: "Kilogram", short_name: "kg" },
  { id: "u-roll", name: "Roll", short_name: "roll" },
  { id: "u-ctn", name: "Carton", short_name: "ctn" },
  { id: "u-m", name: "Meter", short_name: "m" },
  { id: "u-bdl", name: "Bundle", short_name: "bdl" },
];

export const demoBrands = [
  { id: "b-star", name: "Star Tubes", active: true },
  { id: "b-crown", name: "Crown Cores", active: true },
  { id: "b-pakbox", name: "Pak Box", active: true },
  { id: "b-royal", name: "Royal Cartons", active: true },
];

export const demoSizes = [
  { id: "s-24-72", width_mm: 24, length_yd: 72, label: "24mm x 72yd", active: true },
  { id: "s-46-72", width_mm: 46, length_yd: 72, label: "46mm x 72yd", active: true },
  { id: "s-46-70", width_mm: 46, length_yd: 70, label: "46mm x 70yd", active: true },
  { id: "s-60-72", width_mm: 60, length_yd: 72, label: "60mm x 72yd", active: true },
  { id: "s-69-72", width_mm: 69, length_yd: 72, label: "69mm x 72yd", active: true },
  { id: "s-72-72", width_mm: 72, length_yd: 72, label: "72mm x 72yd", active: true },
];

export const demoMicrons = [
  { id: "m-36", value: 36, active: true },
  { id: "m-40", value: 40, active: true },
  { id: "m-45", value: 45, active: true },
  { id: "m-50", value: 50, active: true },
];

export const demoColors = [
  { id: "c-clear", name: "Clear", active: true },
  { id: "c-brown", name: "Brown", active: true },
  { id: "c-printed", name: "Printed", active: true },
  { id: "c-colored", name: "Colored", active: true },
  { id: "c-kraft", name: "Kraft", active: true },
];

function item(row) {
  const status = row.on_hand <= 0 ? "out" : row.on_hand <= row.low_stock_level ? "low" : "in";
  return {
    code: null, brand_id: null, brand_name: null, size_id: null, size_label: null,
    micron_id: null, micron_value: null, color_id: null, color_name: null,
    rolls_per_carton: null, default_rate: 0, active: true, created_at: "2026-09-05T06:00:00Z",
    ...row,
    stock_status: status,
  };
}

export const demoItems = [
  item({ id: "i-jr-40c", kind: "raw", name: "Jumbo Roll 40 micron Clear", code: "JR-40C", category_id: "cat-jumbo", category_name: "Jumbo Roll", micron_id: "m-40", micron_value: 40, color_id: "c-clear", color_name: "Clear", unit_id: "u-m", unit: "m", on_hand: 184250, low_stock_level: 50000, default_rate: 9.5 }),
  item({ id: "i-jr-45b", kind: "raw", name: "Jumbo Roll 45 micron Brown", code: "JR-45B", category_id: "cat-jumbo", category_name: "Jumbo Roll", micron_id: "m-45", micron_value: 45, color_id: "c-brown", color_name: "Brown", unit_id: "u-m", unit: "m", on_hand: 38400, low_stock_level: 50000, default_rate: 10.25 }),
  item({ id: "i-pt-star", kind: "raw", name: "Paper Tube 3 inch", code: "PT-3-STAR", category_id: "cat-tube", category_name: "Paper Tube", brand_id: "b-star", brand_name: "Star Tubes", unit_id: "u-pcs", unit: "pcs", on_hand: 12600, low_stock_level: 3000, default_rate: 6 }),
  item({ id: "i-pt-crown", kind: "raw", name: "Paper Tube 3 inch", code: "PT-3-CRWN", category_id: "cat-tube", category_name: "Paper Tube", brand_id: "b-crown", brand_name: "Crown Cores", unit_id: "u-pcs", unit: "pcs", on_hand: 0, low_stock_level: 3000, default_rate: 5.5 }),
  item({ id: "i-cb-46", kind: "raw", name: "Carton Box 46mm (72 rolls)", code: "CB-46", category_id: "cat-box", category_name: "Carton Box", brand_id: "b-pakbox", brand_name: "Pak Box", unit_id: "u-pcs", unit: "pcs", on_hand: 845, low_stock_level: 200, default_rate: 85 }),
  item({ id: "i-cb-72", kind: "raw", name: "Carton Box 72mm (36 rolls)", code: "CB-72", category_id: "cat-box", category_name: "Carton Box", brand_id: "b-royal", brand_name: "Royal Cartons", unit_id: "u-pcs", unit: "pcs", on_hand: 140, low_stock_level: 200, default_rate: 92 }),
  item({ id: "i-sf", kind: "raw", name: "Shrink Film", code: "SF-01", category_id: "cat-film", category_name: "Shrink Film", unit_id: "u-kg", unit: "kg", on_hand: 412.5, low_stock_level: 100, default_rate: 540 }),
  item({ id: "i-g-lldpe", kind: "raw", name: "LLDPE Granules", code: "GR-LLDPE", category_id: "cat-granules", category_name: "Granules", unit_id: "u-kg", unit: "kg", on_hand: 1850, low_stock_level: 500, default_rate: 395 }),
  item({ id: "i-g-pp", kind: "raw", name: "PP Granules (Blue)", code: "GR-PP-BL", category_id: "cat-granules", category_name: "Granules", unit_id: "u-kg", unit: "kg", on_hand: 140, low_stock_level: 200, default_rate: 360 }),
  item({ id: "i-t-46-72-40c", kind: "finished", name: "Tape 46mm x 72yd 40 mic Clear", code: "T46-72-40C", category_id: "cat-tape", category_name: "Tape Carton", size_id: "s-46-72", size_label: "46mm x 72yd", micron_id: "m-40", micron_value: 40, color_id: "c-clear", color_name: "Clear", unit_id: "u-ctn", unit: "ctn", rolls_per_carton: 72, on_hand: 326, low_stock_level: 50, default_rate: 4800 }),
  item({ id: "i-t-46-70-40b", kind: "finished", name: "Tape 46mm x 70yd 40 mic Brown", code: "T46-70-40B", category_id: "cat-tape", category_name: "Tape Carton", size_id: "s-46-70", size_label: "46mm x 70yd", micron_id: "m-40", micron_value: 40, color_id: "c-brown", color_name: "Brown", unit_id: "u-ctn", unit: "ctn", rolls_per_carton: 72, on_hand: 41, low_stock_level: 50, default_rate: 4650 }),
  item({ id: "i-t-24-72-36c", kind: "finished", name: "Tape 24mm x 72yd 36 mic Clear", code: "T24-72-36C", category_id: "cat-tape", category_name: "Tape Carton", size_id: "s-24-72", size_label: "24mm x 72yd", micron_id: "m-36", micron_value: 36, color_id: "c-clear", color_name: "Clear", unit_id: "u-ctn", unit: "ctn", rolls_per_carton: 144, on_hand: 118, low_stock_level: 30, default_rate: 4200 }),
  item({ id: "i-t-72-72-45c", kind: "finished", name: "Tape 72mm x 72yd 45 mic Clear", code: "T72-72-45C", category_id: "cat-tape", category_name: "Tape Carton", size_id: "s-72-72", size_label: "72mm x 72yd", micron_id: "m-45", micron_value: 45, color_id: "c-clear", color_name: "Clear", unit_id: "u-ctn", unit: "ctn", rolls_per_carton: 36, on_hand: 0, low_stock_level: 20, default_rate: 5100 }),
  item({ id: "i-t-60-72-40p", kind: "finished", name: "Tape 60mm x 72yd 40 mic Printed", code: "T60-72-40P", category_id: "cat-tape", category_name: "Tape Carton", size_id: "s-60-72", size_label: "60mm x 72yd", micron_id: "m-40", micron_value: 40, color_id: "c-printed", color_name: "Printed", unit_id: "u-ctn", unit: "ctn", rolls_per_carton: 48, on_hand: 64, low_stock_level: 20, default_rate: 5600 }),
  item({ id: "i-sf-500", kind: "finished", name: "Stretch Film 500mm 23 mic", code: "SF-500-23", category_id: "cat-stretch", category_name: "Stretch Film", unit_id: "u-roll", unit: "roll", on_hand: 210, low_stock_level: 40, default_rate: 1350 }),
  item({ id: "i-ps-12", kind: "finished", name: "Plastic Strip 12mm Blue", code: "PS-12-BL", category_id: "cat-strip", category_name: "Plastic Strip", unit_id: "u-bdl", unit: "bdl", on_hand: 18, low_stock_level: 25, default_rate: 2250 }),
];

export const demoSettings = {
  id: 1,
  company_name: "Ahmed Munir Packaging Industry",
  short_name: "AM Packaging",
  tagline: "Your Trusted Packaging Partner",
  address: "265-D, Small Industrial Estate, Sargodha Road, Faisalabad",
  phone: "+92 300 0000000",
  email: "",
  ntn: "",
  strn: "",
  logo_url: "",
  gst_enabled: false,
  gst_rate: 18,
  invoice_prefix: "INV-",
  purchase_prefix: "PUR-",
  production_prefix: "PRD-",
  invoice_terms: "",
  invoice_footer: "Thank you for your business.",
};

export const demoMovements = [
  { id: 9, movement_date: "2026-10-03", qty: 24, type: "production_in", note: "PRD-00012", ref_table: "production_runs", ref_id: "pr-12", created_at: "2026-10-03T07:20:00Z", actor_name: "Ali Raza" },
  { id: 8, movement_date: "2026-10-02", qty: 60, type: "production_in", note: "PRD-00011", ref_table: "production_runs", ref_id: "pr-11", created_at: "2026-10-02T12:05:00Z", actor_name: "Muhammad Bilal Hussain" },
  { id: 7, movement_date: "2026-10-01", qty: -2, type: "adjustment", note: "Two cartons water damaged", created_at: "2026-10-01T09:00:00Z", actor_name: "Ahmed Munir" },
  { id: 6, movement_date: "2026-09-30", qty: -100, type: "sale", note: "INV-00016", created_at: "2026-09-30T10:00:00Z", actor_name: "Ali Raza" },
  { id: 5, movement_date: "2026-09-29", qty: -40, type: "sale", note: "INV-00015", created_at: "2026-09-29T11:00:00Z", actor_name: "Ali Raza" },
  { id: 1, movement_date: "2026-09-05", qty: 272, type: "opening", note: "Counted on day one", created_at: "2026-09-05T06:00:00Z", actor_name: "Ahmed Munir" },
];

export const demoActivity = [
  { id: 412, created_at: "2026-10-03T07:20:00Z", user_id: "demo-w1", actor_name: "Ali Raza", action: "created", module: "sale", record_id: "sa-18", record_label: "INV-00018", summary: "Ali Raza created invoice INV-00018 for Faisalabad Traders (Pvt) Ltd (Rs 1,152,000)", changes: { after: { invoice_no: "INV-00018", total: 1152000, sale_date: "2026-10-03", status: "posted" } } },
  { id: 411, created_at: "2026-10-03T07:20:30Z", user_id: "demo-w1", actor_name: "Ali Raza", action: "payment", module: "payment", record_id: "p31", record_label: "Rs 500,000", summary: "Ali Raza recorded a payment of Rs 500,000 received from Faisalabad Traders (Pvt) Ltd", changes: { after: { amount: 500000, method: "bank" } } },
  { id: 410, created_at: "2026-10-03T05:02:00Z", user_id: "demo-w1", actor_name: "Ali Raza", action: "login", module: "session", record_id: "demo-w1", record_label: "Ali Raza", summary: "Ali Raza signed in", changes: null },
  { id: 409, created_at: "2026-10-02T12:05:00Z", user_id: "demo-w2", actor_name: "Muhammad Bilal Hussain", action: "created", module: "production", record_id: "r11", record_label: "PRD-00011", summary: "Muhammad Bilal Hussain created production run PRD-00011: 60 x Tape 46mm x 72yd 40 mic Clear", changes: { after: { run_no: "PRD-00011", qty_made: 60, run_date: "2026-10-02" } } },
  { id: 408, created_at: "2026-10-02T09:40:00Z", user_id: "demo-admin", actor_name: "Ahmed Munir", action: "updated", module: "item", record_id: "i-t-46-72-40c", record_label: "Tape 46mm x 72yd 40 mic Clear", summary: "Ahmed Munir updated item Tape 46mm x 72yd 40 mic Clear", changes: { default_rate: { from: 4650, to: 4800 }, low_stock_level: { from: 40, to: 50 } } },
  { id: 407, created_at: "2026-10-01T09:00:00Z", user_id: "demo-admin", actor_name: "Ahmed Munir", action: "adjusted", module: "stock", record_id: "7", record_label: "Tape 46mm x 72yd 40 mic Clear (ctn)", summary: "Ahmed Munir adjusted stock of Tape 46mm x 72yd 40 mic Clear (ctn) by -2 (reason: Two cartons water damaged)", changes: { after: { qty: -2, type: "adjustment", note: "Two cartons water damaged" } } },
  { id: 406, created_at: "2026-09-30T14:30:00Z", user_id: "demo-admin", actor_name: "Ahmed Munir", action: "voided", module: "purchase", record_id: "pu-6", record_label: "PUR-00006", summary: "Ahmed Munir voided purchase PUR-00006 from Pak Box Industries (Pvt) Ltd (Rs 34,400), reason: Entered twice, see PUR-00007", changes: { status: { from: "posted", to: "void" }, void_reason: { from: "", to: "Entered twice, see PUR-00007" } } },
  { id: 405, created_at: "2026-09-30T10:00:00Z", user_id: "demo-w1", actor_name: "Ali Raza", action: "created", module: "customer", record_id: "cus-gph", record_label: "Gujranwala Packaging House", summary: "Ali Raza created customer Gujranwala Packaging House", changes: { after: { name: "Gujranwala Packaging House", phone: "0300 1234567", opening_balance: 0 } } },
  { id: 404, created_at: "2026-09-29T08:15:00Z", user_id: "demo-admin", actor_name: "Ahmed Munir", action: "created", module: "recipe", record_id: "rc1", record_label: "Tape 46mm x 72yd 40 mic Clear", summary: "Ahmed Munir created the recipe for Tape 46mm x 72yd 40 mic Clear (per unit: 1 pcs Carton Box 46mm, 300 m Jumbo Roll 40 micron Clear, 72 pcs Paper Tube 3 inch, 0.15 kg Shrink Film)", changes: { before: [], after: [{ material: "Carton Box 46mm", qty_per_unit: 1 }, { material: "Jumbo Roll 40 micron Clear", qty_per_unit: 300 }] } },
  { id: 403, created_at: "2026-09-28T16:45:00Z", user_id: "demo-admin-2", actor_name: "Usman Ahmed", action: "deleted", module: "settings", record_id: "b-old", record_label: "Local Tubes", summary: "Usman Ahmed deleted brand Local Tubes", changes: { before: { name: "Local Tubes", active: true } } },
  { id: 402, created_at: "2026-09-28T16:40:00Z", user_id: "demo-admin-2", actor_name: "Usman Ahmed", action: "created", module: "user", record_id: "demo-w3", record_label: "Imran Khan", summary: "Usman Ahmed created user Imran Khan as worker", changes: { after: { full_name: "Imran Khan", role: "worker", active: true } } },
  { id: 401, created_at: "2026-09-28T16:00:00Z", user_id: "demo-admin-2", actor_name: "Usman Ahmed", action: "logout", module: "session", record_id: "demo-admin-2", record_label: "Usman Ahmed", summary: "Usman Ahmed signed out", changes: null },
];

// ---------------------------------------------------------------
// Phase 2: suppliers, purchases and supplier payments.
// Totals are worked out once here so the sample figures agree with each
// other the way the database would make them agree.
// ---------------------------------------------------------------
const round2 = (n) => Math.round(n * 100) / 100;

export const demoSuppliers = [
  { id: "sup-lfc", name: "Lahore Films Co", contact_person: "Tariq Mehmood", phone: "0300 4412233", address: "Sundar Industrial Estate, Lahore", opening_balance: 0, notes: "Jumbo rolls, all microns", active: true, created_at: "2026-09-05T06:00:00Z" },
  { id: "sup-star", name: "Star Tubes Faisalabad", contact_person: "Naveed Akhtar", phone: "0321 6655441", address: "Jhang Road, Faisalabad", opening_balance: 15000, notes: "", active: true, created_at: "2026-09-05T06:05:00Z" },
  { id: "sup-pakbox", name: "Pak Box Industries (Pvt) Ltd", contact_person: "Shahid Iqbal", phone: "041 8721100", address: "Small Industrial Estate, Sargodha Road, Faisalabad", opening_balance: 0, notes: "Cartons 46mm and 72mm", active: true, created_at: "2026-09-06T06:00:00Z" },
  { id: "sup-kpt", name: "Karachi Polymer Traders", contact_person: "", phone: "021 32455667", address: "SITE Area, Karachi", opening_balance: 0, notes: "", active: true, created_at: "2026-09-10T06:00:00Z" },
];

const purchaseSeed = [
  { id: "pu-1", purchase_no: "PUR-00001", supplier_id: "sup-lfc", purchase_date: "2026-09-08", supplier_ref: "LF-2291", discount: 0, gst_rate: 18, other_charges: 6500,
    lines: [{ item_id: "i-jr-40c", qty: 120000, rate: 9.4 }, { item_id: "i-jr-45b", qty: 40000, rate: 10.1 }] },
  { id: "pu-2", purchase_no: "PUR-00002", supplier_id: "sup-star", purchase_date: "2026-09-12", supplier_ref: "", discount: 1500, gst_rate: 0, other_charges: 0,
    lines: [{ item_id: "i-pt-star", qty: 15000, rate: 6 }] },
  { id: "pu-3", purchase_no: "PUR-00003", supplier_id: "sup-pakbox", purchase_date: "2026-09-15", supplier_ref: "PB/0915", discount: 0, gst_rate: 0, other_charges: 2500,
    lines: [{ item_id: "i-cb-46", qty: 800, rate: 85 }, { item_id: "i-cb-72", qty: 300, rate: 92 }] },
  { id: "pu-4", purchase_no: "PUR-00004", supplier_id: "sup-kpt", purchase_date: "2026-09-20", supplier_ref: "KPT-118", discount: 0, gst_rate: 18, other_charges: 0,
    lines: [{ item_id: "i-sf", qty: 400, rate: 540 }] },
  { id: "pu-5", purchase_no: "PUR-00005", supplier_id: "sup-lfc", purchase_date: "2026-09-29", supplier_ref: "LF-2350", discount: 5000, gst_rate: 18, other_charges: 4500,
    lines: [{ item_id: "i-jr-40c", qty: 90000, rate: 9.5 }] },
  { id: "pu-6", purchase_no: "PUR-00006", supplier_id: "sup-pakbox", purchase_date: "2026-09-30", supplier_ref: "PB/0930", discount: 0, gst_rate: 0, other_charges: 0,
    lines: [{ item_id: "i-cb-46", qty: 400, rate: 86 }], status: "void", void_reason: "Entered twice, see PUR-00007" },
  { id: "pu-7", purchase_no: "PUR-00007", supplier_id: "sup-pakbox", purchase_date: "2026-10-01", supplier_ref: "PB/0930", discount: 0, gst_rate: 0, other_charges: 0,
    lines: [{ item_id: "i-cb-46", qty: 400, rate: 86 }] },
];

export const demoSupplierPayments = [
  { id: "sp-1", supplier_id: "sup-lfc", purchase_id: "pu-1", payment_date: "2026-09-08", amount: 500000, method: "bank", reference: "HBL TT 55120", note: "", status: "posted", void_reason: "", created_at: "2026-09-08T10:00:00Z" },
  { id: "sp-2", supplier_id: "sup-lfc", purchase_id: "pu-1", payment_date: "2026-09-25", amount: 1314260, method: "cheque", reference: "Chq 004417", note: "", status: "posted", void_reason: "", created_at: "2026-09-25T10:00:00Z" },
  { id: "sp-3", supplier_id: "sup-star", purchase_id: null, payment_date: "2026-09-14", amount: 15000, method: "cash", reference: "", note: "Old balance", status: "posted", void_reason: "", created_at: "2026-09-14T10:00:00Z" },
  { id: "sp-4", supplier_id: "sup-star", purchase_id: "pu-2", payment_date: "2026-09-30", amount: 50000, method: "cash", reference: "", note: "", status: "posted", void_reason: "", created_at: "2026-09-30T10:00:00Z" },
  { id: "sp-5", supplier_id: "sup-pakbox", purchase_id: "pu-3", payment_date: "2026-09-15", amount: 98100, method: "bank", reference: "MCB 7781", note: "", status: "posted", void_reason: "", created_at: "2026-09-15T10:00:00Z" },
  { id: "sp-6", supplier_id: "sup-kpt", purchase_id: "pu-4", payment_date: "2026-09-21", amount: 100000, method: "online", reference: "IBFT 33019", note: "", status: "void", void_reason: "Sent to the wrong account, reversed by bank", created_at: "2026-09-21T10:00:00Z" },
  { id: "sp-7", supplier_id: "sup-kpt", purchase_id: "pu-4", payment_date: "2026-09-22", amount: 100000, method: "online", reference: "IBFT 33102", note: "", status: "posted", void_reason: "", created_at: "2026-09-22T10:00:00Z" },
];

const itemById = (id) => demoItems.find((i) => i.id === id);

export const demoPurchaseLines = purchaseSeed.flatMap((p) =>
  p.lines.map((l, i) => {
    const it = itemById(l.item_id);
    return { id: `${p.id}-l${i}`, purchase_id: p.id, item_id: l.item_id, item_name: it?.name ?? "", unit: it?.unit ?? "", brand_name: it?.brand_name ?? null, qty: l.qty, rate: l.rate, amount: round2(l.qty * l.rate) };
  }),
);

export const demoPurchases = purchaseSeed.map((p) => {
  const subtotal = round2(p.lines.reduce((s, l) => s + round2(l.qty * l.rate), 0));
  const gst_amount = round2(((subtotal - p.discount) * p.gst_rate) / 100);
  const total = round2(subtotal - p.discount + gst_amount + p.other_charges);
  const status = p.status ?? "posted";
  const paid = round2(demoSupplierPayments.filter((x) => x.purchase_id === p.id && x.status === "posted").reduce((s, x) => s + x.amount, 0));
  const supplier = demoSuppliers.find((s) => s.id === p.supplier_id);
  return {
    id: p.id, purchase_no: p.purchase_no, purchase_date: p.purchase_date, supplier_id: p.supplier_id, supplier_name: supplier.name,
    supplier_ref: p.supplier_ref, subtotal, discount: p.discount, gst_rate: p.gst_rate, gst_amount, other_charges: p.other_charges, total,
    notes: "", status, void_reason: p.void_reason ?? "", created_at: `${p.purchase_date}T09:00:00Z`, created_by_name: "Ali Raza",
    line_count: p.lines.length, paid,
    payment_status: status === "void" ? "void" : paid >= total ? "paid" : paid > 0 ? "partly" : "unpaid",
  };
}).sort((a, b) => b.purchase_date.localeCompare(a.purchase_date) || b.purchase_no.localeCompare(a.purchase_no));

export const demoSupplierBalances = demoSuppliers.map((s) => {
  const billed = round2(demoPurchases.filter((p) => p.supplier_id === s.id && p.status === "posted").reduce((t, p) => t + p.total, 0));
  const paid = round2(demoSupplierPayments.filter((p) => p.supplier_id === s.id && p.status === "posted").reduce((t, p) => t + p.amount, 0));
  const last = demoPurchases.filter((p) => p.supplier_id === s.id && p.status === "posted").map((p) => p.purchase_date).sort().pop() ?? null;
  return { id: s.id, name: s.name, phone: s.phone, active: s.active, opening_balance: s.opening_balance, billed, paid, balance: round2(s.opening_balance + billed - paid), last_purchase: last };
});

/** The same rows supplier_ledger() returns, for demo mode. */
export function demoSupplierLedger(supplierId, from, to) {
  const s = demoSuppliers.find((x) => x.id === supplierId);
  if (!s) return [];
  const inRange = (d) => (!from || d >= from) && (!to || d <= to);
  let open = s.opening_balance;
  if (from) {
    open += demoPurchases.filter((p) => p.supplier_id === supplierId && p.status === "posted" && p.purchase_date < from).reduce((t, p) => t + p.total, 0);
    open -= demoSupplierPayments.filter((p) => p.supplier_id === supplierId && p.status === "posted" && p.payment_date < from).reduce((t, p) => t + p.amount, 0);
  }
  const entries = [
    ...demoPurchases.filter((p) => p.supplier_id === supplierId && p.status === "posted" && inRange(p.purchase_date)).map((p) => ({
      entry_date: p.purchase_date, kind: "purchase", entry_id: p.id, purchase_id: p.id, ref: p.purchase_no,
      description: `Purchase${p.supplier_ref ? `, their bill ${p.supplier_ref}` : ""}`, debit: p.total, credit: 0, ts: p.created_at,
    })),
    ...demoSupplierPayments.filter((p) => p.supplier_id === supplierId && p.status === "posted" && inRange(p.payment_date)).map((p) => ({
      entry_date: p.payment_date, kind: "payment", entry_id: p.id, purchase_id: p.purchase_id, ref: demoPurchases.find((x) => x.id === p.purchase_id)?.purchase_no ?? "",
      description: `Payment, ${p.method}${p.reference ? ` (${p.reference})` : ""}`, debit: 0, credit: p.amount, ts: p.created_at,
    })),
  ].sort((a, b) => a.entry_date.localeCompare(b.entry_date) || a.ts.localeCompare(b.ts));
  const rows = [{ entry_date: from ?? null, kind: "opening", entry_id: null, purchase_id: null, ref: "", description: from ? "Balance brought forward" : "Opening balance", debit: Math.max(open, 0), credit: Math.max(-open, 0) }, ...entries];
  let bal = 0;
  return rows.map((r) => {
    bal = round2(bal + r.debit - r.credit);
    return { ...r, balance: bal };
  });
}

// ---------------------------------------------------------------
// Phase 3: recipes and production runs
// ---------------------------------------------------------------
export const demoRecipes = {
  "i-t-46-72-40c": { notes: "Standard pack, 72 rolls", lines: [
    { raw_item_id: "i-cb-46", qty_per_unit: 1 }, { raw_item_id: "i-jr-40c", qty_per_unit: 300 },
    { raw_item_id: "i-pt-star", qty_per_unit: 72 }, { raw_item_id: "i-sf", qty_per_unit: 0.15 }] },
  "i-t-46-70-40b": { notes: "Standard pack, 72 rolls", lines: [
    { raw_item_id: "i-cb-46", qty_per_unit: 1 }, { raw_item_id: "i-jr-45b", qty_per_unit: 290 },
    { raw_item_id: "i-pt-star", qty_per_unit: 72 }, { raw_item_id: "i-sf", qty_per_unit: 0.15 }] },
  "i-t-24-72-36c": { notes: "144 rolls per carton", lines: [
    { raw_item_id: "i-cb-46", qty_per_unit: 1 }, { raw_item_id: "i-jr-40c", qty_per_unit: 300 },
    { raw_item_id: "i-pt-star", qty_per_unit: 144 }, { raw_item_id: "i-sf", qty_per_unit: 0.12 }] },
  "i-sf-500": { notes: "", lines: [{ raw_item_id: "i-g-lldpe", qty_per_unit: 2.6 }] },
  "i-ps-12": { notes: "", lines: [{ raw_item_id: "i-g-pp", qty_per_unit: 10 }] },
};

// actual: optional overrides of what was really used, by material
const runSeed = [
  { id: "pr-12", run_no: "PRD-00012", run_date: "2026-10-03", item_id: "i-t-46-72-40c", qty_made: 24, by: "Muhammad Bilal Hussain", at: "2026-10-03T08:10:00Z" },
  { id: "pr-11", run_no: "PRD-00011", run_date: "2026-10-02", item_id: "i-t-46-72-40c", qty_made: 60, by: "Muhammad Bilal Hussain", at: "2026-10-02T12:05:00Z", actual: { "i-sf": 10.5, "i-pt-star": 4340 }, notes: "Two cores split on the slitter" },
  { id: "pr-10", run_no: "PRD-00010", run_date: "2026-10-01", item_id: "i-sf-500", qty_made: 120, by: "Ali Raza", at: "2026-10-01T11:00:00Z", actual: { "i-g-lldpe": 318 } },
  { id: "pr-09", run_no: "PRD-00009", run_date: "2026-09-29", item_id: "i-t-46-70-40b", qty_made: 40, by: "Ali Raza", at: "2026-09-29T11:00:00Z" },
  { id: "pr-08", run_no: "PRD-00008", run_date: "2026-09-27", item_id: "i-ps-12", qty_made: 30, by: "Imran Khan", at: "2026-09-27T09:30:00Z" },
  { id: "pr-07", run_no: "PRD-00007", run_date: "2026-09-26", item_id: "i-t-24-72-36c", qty_made: 15, by: "Ali Raza", at: "2026-09-26T10:00:00Z", status: "void", void_reason: "Wrong size picked, re-entered as PRD-00009" },
  { id: "pr-06", run_no: "PRD-00006", run_date: "2026-09-24", item_id: "i-t-60-72-40p", qty_made: 20, by: "Muhammad Bilal Hussain", at: "2026-09-24T10:00:00Z",
    manual: [{ raw_item_id: "i-jr-40c", qty: 3100 }, { raw_item_id: "i-pt-star", qty: 960 }, { raw_item_id: "i-cb-72", qty: 20 }] },
];

const r3 = (n) => Math.round(n * 1000) / 1000;

export const demoProductionConsumption = runSeed.flatMap((r) => {
  const recipe = demoRecipes[r.item_id];
  const rows = r.manual
    ? r.manual.map((m) => ({ raw_item_id: m.raw_item_id, qty: m.qty, expected_qty: null }))
    : recipe.lines.map((l) => {
        const expected = r3(l.qty_per_unit * r.qty_made);
        return { raw_item_id: l.raw_item_id, qty: r.actual?.[l.raw_item_id] ?? expected, expected_qty: expected };
      });
  return rows.map((row, i) => {
    const it = demoItems.find((x) => x.id === row.raw_item_id);
    return { id: `${r.id}-c${i}`, run_id: r.id, ...row, item_name: it?.name ?? "", unit: it?.unit ?? "", on_hand: it?.on_hand ?? 0 };
  });
});

export const demoProductionRuns = runSeed.map((r) => {
  const it = demoItems.find((x) => x.id === r.item_id);
  const cons = demoProductionConsumption.filter((c) => c.run_id === r.id);
  return {
    id: r.id, run_no: r.run_no, run_date: r.run_date, item_id: r.item_id, item_name: it.name, item_code: it.code,
    category_name: it.category_name, unit: it.unit, qty_made: r.qty_made, notes: r.notes ?? "", status: r.status ?? "posted",
    void_reason: r.void_reason ?? "", created_by: null, created_by_name: r.by, created_at: r.at,
    materials: cons.length, over_recipe: cons.filter((c) => c.expected_qty !== null && c.qty > c.expected_qty).length,
  };
});

// ---------------------------------------------------------------
// Phase 4: customers, sales and payments received
// ---------------------------------------------------------------
export const demoCustomers = [
  { id: "cus-ftl", name: "Faisalabad Traders (Pvt) Ltd", contact_person: "Haji Rafiq", phone: "0300 6612345", address: "Montgomery Bazaar, Faisalabad", ntn: "4211876-3", opening_balance: 25000, notes: "", active: true, created_at: "2026-09-05T06:00:00Z" },
  { id: "cus-gph", name: "Gujranwala Packaging House", contact_person: "Asif Butt", phone: "0300 1234567", address: "GT Road, Gujranwala", ntn: "", opening_balance: 0, notes: "", active: true, created_at: "2026-09-30T10:00:00Z" },
  { id: "cus-lsm", name: "Lahore Stationery Mart", contact_person: "", phone: "042 37221100", address: "Urdu Bazaar, Lahore", ntn: "", opening_balance: 0, notes: "Pays cash on delivery", active: true, created_at: "2026-09-06T06:00:00Z" },
  { id: "cus-kce", name: "Karachi Courier Express", contact_person: "Saima Noor", phone: "021 34567890", address: "Shahrah-e-Faisal, Karachi", ntn: "7765432-1", opening_balance: 0, notes: "", active: true, created_at: "2026-09-07T06:00:00Z" },
  { id: "cus-sex", name: "Sialkot Exporters", contact_person: "Bilal Cheema", phone: "0321 7788990", address: "Small Industries Estate, Sialkot", ntn: "", opening_balance: 12000, notes: "", active: true, created_at: "2026-09-08T06:00:00Z" },
];

const saleSeed = [
  { id: "sa-14", invoice_no: "INV-00014", customer_id: "cus-ftl", sale_date: "2026-09-12", due_date: null, discount: 0, gst_rate: 0, other_charges: 0,
    lines: [{ item_id: "i-t-46-72-40c", qty: 100, rate: 4650 }] },
  { id: "sa-15", invoice_no: "INV-00015", customer_id: "cus-gph", sale_date: "2026-09-29", due_date: "2026-09-30", discount: 0, gst_rate: 0, other_charges: 1500,
    lines: [{ item_id: "i-t-46-70-40b", qty: 40, rate: 4650 }] },
  { id: "sa-16", invoice_no: "INV-00016", customer_id: "cus-ftl", sale_date: "2026-09-30", due_date: "2026-10-30", discount: 5000, gst_rate: 18, other_charges: 0,
    lines: [{ item_id: "i-t-46-72-40c", qty: 100, rate: 4750 }] },
  { id: "sa-17", invoice_no: "INV-00017", customer_id: "cus-lsm", sale_date: "2026-10-01", due_date: null, discount: 0, gst_rate: 0, other_charges: 0,
    lines: [{ item_id: "i-sf-500", qty: 50, rate: 1350 }, { item_id: "i-ps-12", qty: 10, rate: 2250 }] },
  { id: "sa-19", invoice_no: "INV-00019", customer_id: "cus-kce", sale_date: "2026-10-02", due_date: null, discount: 0, gst_rate: 0, other_charges: 0,
    lines: [{ item_id: "i-t-24-72-36c", qty: 30, rate: 4200 }], status: "void", void_reason: "Order cancelled by phone" },
  { id: "sa-18", invoice_no: "INV-00018", customer_id: "cus-ftl", sale_date: "2026-10-03", created_at: "2026-10-03T07:20:00Z", due_date: "2026-11-02", discount: 0, gst_rate: 0, other_charges: 0,
    lines: [{ item_id: "i-t-46-72-40c", qty: 240, rate: 4800 }] },
  { id: "sa-20", invoice_no: "INV-00020", customer_id: "cus-sex", sale_date: "2026-10-03", due_date: "2026-10-17", discount: 2000, gst_rate: 0, other_charges: 0,
    lines: [{ item_id: "i-t-60-72-40p", qty: 12, rate: 5600 }] },
];

export const demoCustomerPayments = [
  { id: "cp-1", customer_id: "cus-ftl", sale_id: "sa-14", payment_date: "2026-09-12", amount: 465000, method: "bank", reference: "MCB 55190", note: "", status: "posted", void_reason: "", created_at: "2026-09-12T12:00:00Z", recorded_by: "Ahmed Munir" },
  { id: "cp-2", customer_id: "cus-ftl", sale_id: null, payment_date: "2026-09-20", amount: 25000, method: "cash", reference: "", note: "Old balance cleared", status: "posted", void_reason: "", created_at: "2026-09-20T12:00:00Z", recorded_by: "Ahmed Munir" },
  { id: "cp-3", customer_id: "cus-ftl", sale_id: "sa-16", payment_date: "2026-10-01", amount: 300000, method: "cheque", reference: "Chq 778812", note: "", status: "posted", void_reason: "", created_at: "2026-10-01T12:00:00Z", recorded_by: "Usman Ahmed" },
  { id: "cp-4", customer_id: "cus-lsm", sale_id: "sa-17", payment_date: "2026-10-01", amount: 90000, method: "cash", reference: "", note: "", status: "posted", void_reason: "", created_at: "2026-10-01T13:00:00Z", recorded_by: "Ali Raza" },
  { id: "cp-5", customer_id: "cus-ftl", sale_id: "sa-18", payment_date: "2026-10-03", amount: 500000, method: "bank", reference: "HBL 99021", note: "", status: "posted", void_reason: "", created_at: "2026-10-03T07:20:30Z", recorded_by: "Ali Raza" },
  { id: "cp-6", customer_id: "cus-gph", sale_id: "sa-15", payment_date: "2026-09-30", amount: 50000, method: "cheque", reference: "Chq 1020", note: "", status: "void", void_reason: "Cheque bounced", created_at: "2026-09-30T15:00:00Z", recorded_by: "Ahmed Munir" },
];

export const demoSaleLines = saleSeed.flatMap((s) =>
  s.lines.map((l, i) => {
    const it = demoItems.find((x) => x.id === l.item_id);
    return { id: `${s.id}-l${i}`, sale_id: s.id, item_id: l.item_id, item_name: it?.name ?? "", item_code: it?.code ?? "", unit: it?.unit ?? "", qty: l.qty, rate: l.rate, amount: round2(l.qty * l.rate) };
  }),
);

const TODAY = "2026-10-03";

export const demoSales = saleSeed.map((s) => {
  const subtotal = round2(s.lines.reduce((t, l) => t + round2(l.qty * l.rate), 0));
  const gst_amount = round2(((subtotal - s.discount) * s.gst_rate) / 100);
  const total = round2(subtotal - s.discount + gst_amount + s.other_charges);
  const status = s.status ?? "posted";
  const paid = round2(demoCustomerPayments.filter((x) => x.sale_id === s.id && x.status === "posted").reduce((t, x) => t + x.amount, 0));
  const customer = demoCustomers.find((c) => c.id === s.customer_id);
  return {
    id: s.id, invoice_no: s.invoice_no, sale_date: s.sale_date, due_date: s.due_date, customer_id: s.customer_id, customer_name: customer.name,
    subtotal, discount: s.discount, gst_rate: s.gst_rate, gst_amount, other_charges: s.other_charges, total,
    notes: "", status, void_reason: s.void_reason ?? "", created_at: s.created_at ?? `${s.sale_date}T09:00:00Z`, created_by_name: "Ali Raza",
    line_count: s.lines.length, paid,
    payment_status: status === "void" ? "void" : paid >= total ? "paid" : paid > 0 ? "partly" : "unpaid",
    overdue: status === "posted" && Boolean(s.due_date) && s.due_date < TODAY && paid < total,
  };
}).sort((a, b) => b.sale_date.localeCompare(a.sale_date) || b.invoice_no.localeCompare(a.invoice_no));

export const demoCustomerBalances = demoCustomers.map((c) => {
  const billed = round2(demoSales.filter((s) => s.customer_id === c.id && s.status === "posted").reduce((t, s) => t + s.total, 0));
  const paid = round2(demoCustomerPayments.filter((p) => p.customer_id === c.id && p.status === "posted").reduce((t, p) => t + p.amount, 0));
  const last = demoSales.filter((s) => s.customer_id === c.id && s.status === "posted").map((s) => s.sale_date).sort().pop() ?? null;
  return { id: c.id, name: c.name, phone: c.phone, active: c.active, opening_balance: c.opening_balance, billed, paid, balance: round2(c.opening_balance + billed - paid), last_sale: last };
});

/** The same rows customer_ledger() returns, for demo mode. */
export function demoCustomerLedger(customerId, from, to) {
  const c = demoCustomers.find((x) => x.id === customerId);
  if (!c) return [];
  const inRange = (d) => (!from || d >= from) && (!to || d <= to);
  let open = c.opening_balance;
  if (from) {
    open += demoSales.filter((s) => s.customer_id === customerId && s.status === "posted" && s.sale_date < from).reduce((t, s) => t + s.total, 0);
    open -= demoCustomerPayments.filter((p) => p.customer_id === customerId && p.status === "posted" && p.payment_date < from).reduce((t, p) => t + p.amount, 0);
  }
  const entries = [
    ...demoSales.filter((s) => s.customer_id === customerId && s.status === "posted" && inRange(s.sale_date)).map((s) => ({
      entry_date: s.sale_date, kind: "invoice", entry_id: s.id, sale_id: s.id, ref: s.invoice_no, description: "Invoice", debit: s.total, credit: 0, ts: s.created_at,
    })),
    ...demoCustomerPayments.filter((p) => p.customer_id === customerId && p.status === "posted" && inRange(p.payment_date)).map((p) => ({
      entry_date: p.payment_date, kind: "payment", entry_id: p.id, sale_id: p.sale_id, ref: demoSales.find((s) => s.id === p.sale_id)?.invoice_no ?? "",
      description: `Payment, ${p.method}${p.reference ? ` (${p.reference})` : ""}`, debit: 0, credit: p.amount, ts: p.created_at,
    })),
  ].sort((a, b) => a.entry_date.localeCompare(b.entry_date) || a.ts.localeCompare(b.ts));
  const rows = [{ entry_date: from ?? null, kind: "opening", entry_id: null, sale_id: null, ref: "", description: from ? "Balance brought forward" : "Opening balance", debit: Math.max(open, 0), credit: Math.max(-open, 0) }, ...entries];
  let bal = 0;
  return rows.map((r) => {
    bal = round2(bal + r.debit - r.credit);
    return { ...r, balance: bal };
  });
}
