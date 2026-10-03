// Shapes report rows into what the chart components take: an axis tick and
// a full label per period, and the same figures as a formatted table.
// Server and client safe (no data access here).
import { periodLabel, periodTick } from "./date-helpers";
import { formatMoney, formatQty } from "./format-helpers";

const FORMATS = {
  money: (v) => formatMoney(Math.round(v)),
  qty: (v) => formatQty(v),
};

/**
 * rows: report rows with a `period`. fields: [{ key, label, format, unit }].
 * Returns { data, table, empty }.
 */
export function periodView(rows, grain, fields) {
  const years = new Set(rows.map((r) => r.period.slice(0, 4)));
  const withYear = years.size > 1;
  const data = rows.map((r) => {
    const row = { tick: periodTick(r.period, grain, { withYear }), label: periodLabel(r.period, grain) };
    for (const f of fields) row[f.key] = r[f.key] === null || r[f.key] === undefined ? null : Number(r[f.key]);
    return row;
  });
  const fmt = (f, v) => (v === null ? "None" : `${FORMATS[f.format ?? "money"](v)}${f.unit ? ` ${f.unit}` : ""}`);
  const table = {
    columns: [{ label: grain === "month" ? "Month" : grain === "week" ? "Week" : "Day" }, ...fields.map((f) => ({ label: f.label, align: "right" }))],
    rows: data.map((d) => [d.label, ...fields.map((f) => fmt(f, d[f.key]))]),
  };
  const empty = data.every((d) => fields.every((f) => !d[f.key]));
  return { data, table, empty };
}
