// Dates in the business's own time zone (Pakistan). Safe on both sides.

const TZ = "Asia/Karachi";

const dateFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "2-digit", month: "short", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: true });

/** "03 Oct 2026" */
export function formatDate(value) {
  if (!value) return "";
  const d = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00Z`) : new Date(value);
  return Number.isNaN(d.getTime()) ? "" : dateFmt.format(d);
}

/** "03 Oct 2026, 04:15 pm" */
export function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${dateFmt.format(d)}, ${timeFmt.format(d).toLowerCase()}`;
}

/** Today in Pakistan as YYYY-MM-DD, for date inputs and queries. */
export function todayISO() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return parts;
}

// Date-only arithmetic on "YYYY-MM-DD" strings (no time zone involved).
const asUTC = (iso) => new Date(`${iso}T00:00:00Z`);
const isoOf = (d) => d.toISOString().slice(0, 10);

export function addDays(iso, n) {
  const d = asUTC(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return isoOf(d);
}

export function addMonths(iso, n) {
  const d = asUTC(`${iso.slice(0, 7)}-01`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return isoOf(d);
}

export function startOfMonth(iso) {
  return `${iso.slice(0, 7)}-01`;
}

export function daysBetween(fromIso, toIso) {
  return Math.round((asUTC(toIso) - asUTC(fromIso)) / 86400000);
}

const utc = (opts) => new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...opts });
const dayShort = utc({ day: "numeric", month: "short" });
const monthShort = utc({ month: "short" });
const monthYear = utc({ month: "short", year: "2-digit" });
const monthLong = utc({ month: "long", year: "numeric" });

/** Axis tick for a report period: "3 Oct", "Oct" (or "Oct 26" when the range spans years). */
export function periodTick(iso, grain, { withYear = false } = {}) {
  const d = asUTC(iso);
  if (grain === "month") return (withYear ? monthYear : monthShort).format(d);
  return dayShort.format(d);
}

/** Full label for tooltips and tables: "03 Oct 2026", "Week of 28 Sep 2026", "October 2026". */
export function periodLabel(iso, grain) {
  if (grain === "month") return monthLong.format(asUTC(iso));
  if (grain === "week") return `Week of ${formatDate(iso)}`;
  return formatDate(iso);
}
