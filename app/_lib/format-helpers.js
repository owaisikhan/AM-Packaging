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

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
  "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function belowHundred(n) {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ""}`;
}

function belowThousand(n) {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return [h ? `${ONES[h]} Hundred` : "", rest ? belowHundred(rest) : ""].filter(Boolean).join(" ");
}

/** Whole number in Pakistani style words: 1152000 -> "Eleven Lakh Fifty Two Thousand". */
function wholeToWords(n) {
  if (n === 0) return "Zero";
  const parts = [];
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;
  if (crore) parts.push(`${wholeToWords(crore)} Crore`);
  if (lakh) parts.push(`${belowHundred(lakh)} Lakh`);
  if (thousand) parts.push(`${belowHundred(thousand)} Thousand`);
  if (rest) parts.push(belowThousand(rest));
  return parts.join(" ");
}

/** "Rupees Eleven Lakh Fifty Two Thousand and Fifty Paisa Only", for invoices. */
export function amountInWords(value) {
  const n = Math.round(Math.abs(Number(value) || 0) * 100);
  const rupees = Math.floor(n / 100);
  const paisa = n % 100;
  return `Rupees ${wholeToWords(rupees)}${paisa ? ` and ${belowHundred(paisa)} Paisa` : ""} Only`;
}
