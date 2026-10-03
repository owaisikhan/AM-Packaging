import { formatCompact, formatCompactMoney, formatMoney, formatQty } from "@/app/_lib/format-helpers";

// Charts get a format name, not a function (server pages cannot pass
// functions to client components).
export function valueFormatter(format, unit) {
  if (format === "money") return (v) => formatMoney(Math.round(v));
  if (format === "percent") return (v) => `${v > 0 ? "+" : ""}${formatQty(v)}%`;
  return (v) => (unit ? `${formatQty(v)} ${unit}` : formatQty(v));
}

export function axisFormatter(format) {
  if (format === "money") return (v) => formatCompactMoney(v);
  if (format === "percent") return (v) => `${formatQty(v)}%`;
  return (v) => formatCompact(v);
}
