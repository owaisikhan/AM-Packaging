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
