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
  { id: 9, movement_date: "2026-10-03", qty: -24, type: "sale", note: "INV-00018", created_at: "2026-10-03T07:20:00Z", actor_name: "Ali Raza" },
  { id: 8, movement_date: "2026-10-02", qty: 60, type: "production_in", note: "PRD-00011", created_at: "2026-10-02T12:05:00Z", actor_name: "Muhammad Bilal Hussain" },
  { id: 7, movement_date: "2026-10-01", qty: -2, type: "adjustment", note: "Two cartons water damaged", created_at: "2026-10-01T09:00:00Z", actor_name: "Ahmed Munir" },
  { id: 6, movement_date: "2026-09-30", qty: -100, type: "sale", note: "INV-00016", created_at: "2026-09-30T10:00:00Z", actor_name: "Ali Raza" },
  { id: 5, movement_date: "2026-09-29", qty: 120, type: "production_in", note: "PRD-00009", created_at: "2026-09-29T11:00:00Z", actor_name: "Ali Raza" },
  { id: 1, movement_date: "2026-09-05", qty: 272, type: "opening", note: "Counted on day one", created_at: "2026-09-05T06:00:00Z", actor_name: "Ahmed Munir" },
];

export const demoActivity = [
  { id: 412, created_at: "2026-10-03T07:20:00Z", user_id: "demo-w1", actor_name: "Ali Raza", action: "created", module: "sale", record_id: "s18", record_label: "INV-00018", summary: "Ali Raza created invoice INV-00018 for Faisalabad Traders (Pvt) Ltd (Rs 1,152,000)", changes: { after: { invoice_no: "INV-00018", total: 1152000, sale_date: "2026-10-03", status: "posted" } } },
  { id: 411, created_at: "2026-10-03T07:20:30Z", user_id: "demo-w1", actor_name: "Ali Raza", action: "payment", module: "payment", record_id: "p31", record_label: "Rs 500,000", summary: "Ali Raza recorded a payment of Rs 500,000 received from Faisalabad Traders (Pvt) Ltd", changes: { after: { amount: 500000, method: "bank" } } },
  { id: 410, created_at: "2026-10-03T05:02:00Z", user_id: "demo-w1", actor_name: "Ali Raza", action: "login", module: "session", record_id: "demo-w1", record_label: "Ali Raza", summary: "Ali Raza signed in", changes: null },
  { id: 409, created_at: "2026-10-02T12:05:00Z", user_id: "demo-w2", actor_name: "Muhammad Bilal Hussain", action: "created", module: "production", record_id: "r11", record_label: "PRD-00011", summary: "Muhammad Bilal Hussain created production run PRD-00011: 60 x Tape 46mm x 72yd 40 mic Clear", changes: { after: { run_no: "PRD-00011", qty_made: 60, run_date: "2026-10-02" } } },
  { id: 408, created_at: "2026-10-02T09:40:00Z", user_id: "demo-admin", actor_name: "Ahmed Munir", action: "updated", module: "item", record_id: "i-t-46-72-40c", record_label: "Tape 46mm x 72yd 40 mic Clear", summary: "Ahmed Munir updated item Tape 46mm x 72yd 40 mic Clear", changes: { default_rate: { from: 4650, to: 4800 }, low_stock_level: { from: 40, to: 50 } } },
  { id: 407, created_at: "2026-10-01T09:00:00Z", user_id: "demo-admin", actor_name: "Ahmed Munir", action: "adjusted", module: "stock", record_id: "7", record_label: "Tape 46mm x 72yd 40 mic Clear (ctn)", summary: "Ahmed Munir adjusted stock of Tape 46mm x 72yd 40 mic Clear (ctn) by -2 (reason: Two cartons water damaged)", changes: { after: { qty: -2, type: "adjustment", note: "Two cartons water damaged" } } },
  { id: 406, created_at: "2026-09-30T14:30:00Z", user_id: "demo-admin", actor_name: "Ahmed Munir", action: "voided", module: "purchase", record_id: "pu7", record_label: "PUR-00007", summary: "Ahmed Munir voided purchase PUR-00007 from Lahore Films Co (Rs 86,850), reason: Entered twice", changes: { status: { from: "posted", to: "void" }, void_reason: { from: "", to: "Entered twice" } } },
  { id: 405, created_at: "2026-09-30T10:00:00Z", user_id: "demo-w1", actor_name: "Ali Raza", action: "created", module: "customer", record_id: "c9", record_label: "Gujranwala Packaging House", summary: "Ali Raza created customer Gujranwala Packaging House", changes: { after: { name: "Gujranwala Packaging House", phone: "0300 1234567", opening_balance: 0 } } },
  { id: 404, created_at: "2026-09-29T08:15:00Z", user_id: "demo-admin", actor_name: "Ahmed Munir", action: "created", module: "recipe", record_id: "rc1", record_label: "Tape 46mm x 72yd 40 mic Clear", summary: "Ahmed Munir created the recipe for Tape 46mm x 72yd 40 mic Clear (per unit: 1 pcs Carton Box 46mm, 3,950 m Jumbo Roll 40 micron Clear, 72 pcs Paper Tube 3 inch, 0.15 kg Shrink Film)", changes: { before: [], after: [{ material: "Carton Box 46mm", qty_per_unit: 1 }, { material: "Jumbo Roll 40 micron Clear", qty_per_unit: 3950 }] } },
  { id: 403, created_at: "2026-09-28T16:45:00Z", user_id: "demo-admin-2", actor_name: "Usman Ahmed", action: "deleted", module: "settings", record_id: "b-old", record_label: "Local Tubes", summary: "Usman Ahmed deleted brand Local Tubes", changes: { before: { name: "Local Tubes", active: true } } },
  { id: 402, created_at: "2026-09-28T16:40:00Z", user_id: "demo-admin-2", actor_name: "Usman Ahmed", action: "created", module: "user", record_id: "demo-w3", record_label: "Imran Khan", summary: "Usman Ahmed created user Imran Khan as worker", changes: { after: { full_name: "Imran Khan", role: "worker", active: true } } },
  { id: 401, created_at: "2026-09-28T16:00:00Z", user_id: "demo-admin-2", actor_name: "Usman Ahmed", action: "logout", module: "session", record_id: "demo-admin-2", record_label: "Usman Ahmed", summary: "Usman Ahmed signed out", changes: null },
];
