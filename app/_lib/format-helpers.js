// Money, quantity and number formatting. Safe on the server and the client,
// so every screen writes figures the same way.

const moneyFmt = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 2, minimumFractionDigits: 0 });
const money2Fmt = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const qtyFmt = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 3 });

function toNumber(value) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** "Rs 125,000" or "Rs 1,250.50". Negative shows as "-Rs 500". */
export function formatMoney(value, { decimals = false } = {}) {
  const n = toNumber(value);
  const body = (decimals ? money2Fmt : moneyFmt).format(Math.abs(n));
  return `${n < 0 ? "-" : ""}Rs ${body}`;
}

/** 1,250 or 0.15, never trailing zeros. */
export function formatQty(value) {
  return qtyFmt.format(toNumber(value));
}

/** "1,250 pcs" */
export function formatQtyUnit(value, unit) {
  return unit ? `${formatQty(value)} ${unit}` : formatQty(value);
}

export function formatCount(value) {
  return qtyFmt.format(Math.round(toNumber(value)));
}

/** Micron values come back as "40.00"; show "40". */
export function formatMicron(value) {
  if (value === null || value === undefined || value === "") return "";
  return `${formatQty(value)} mic`;
}

export function initials(name) {
  return String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
