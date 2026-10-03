// The report functions of 0007_reports.sql, worked out from the demo rows so
// demo mode shows the same shapes the database returns. Keep each function's
// rows identical in shape to its SQL twin.
import * as demo from "./demo-data";

const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const iso = (d) => d.toISOString().slice(0, 10);
const asDate = (s) => new Date(`${s}T00:00:00Z`);

/** Start of the day, Monday-week or month a date falls in (ISO string). */
export function truncDate(s, grain) {
  const d = asDate(s);
  if (grain === "month") return `${s.slice(0, 7)}-01`;
  if (grain === "week") {
    const back = (d.getUTCDay() + 6) % 7;
    d.setUTCDate(d.getUTCDate() - back);
    return iso(d);
  }
  return s;
}

/** Every period from one date to another, like report_periods(). */
export function periods(from, to, grain) {
  const out = [];
  const d = asDate(truncDate(from, grain));
  const end = truncDate(to, grain);
  while (iso(d) <= end) {
    out.push(iso(d));
    if (grain === "month") d.setUTCMonth(d.getUTCMonth() + 1);
    else d.setUTCDate(d.getUTCDate() + (grain === "week" ? 7 : 1));
  }
  return out;
}

const inRange = (d, from, to) => d >= from && d <= to;
const postedSales = () => demo.demoSales.filter((s) => s.status === "posted");
const postedPurchases = () => demo.demoPurchases.filter((p) => p.status === "posted");
const postedRuns = () => demo.demoProductionRuns.filter((r) => r.status === "posted");
const item = (id) => demo.demoItems.find((i) => i.id === id);

function sumBy(rows, key, value) {
  const m = new Map();
  for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + value(r));
  return m;
}

export function tradeSeries(from, to, grain) {
  const sales = postedSales().filter((s) => inRange(s.sale_date, from, to));
  const bills = postedPurchases().filter((p) => inRange(p.purchase_date, from, to));
  const st = sumBy(sales, (s) => truncDate(s.sale_date, grain), (s) => s.total);
  const sn = sumBy(sales, (s) => truncDate(s.sale_date, grain), () => 1);
  const pt = sumBy(bills, (p) => truncDate(p.purchase_date, grain), (p) => p.total);
  const pn = sumBy(bills, (p) => truncDate(p.purchase_date, grain), () => 1);
  return periods(from, to, grain).map((period) => ({
    period, sales: round(st.get(period) ?? 0), invoices: sn.get(period) ?? 0, purchases: round(pt.get(period) ?? 0), bills: pn.get(period) ?? 0,
  }));
}

export function topCustomers(from, to, limit = 10) {
  const rows = postedSales().filter((s) => inRange(s.sale_date, from, to));
  const total = sumBy(rows, (s) => s.customer_id, (s) => s.total);
  const n = sumBy(rows, (s) => s.customer_id, () => 1);
  return [...total.entries()]
    .map(([id, t]) => ({ customer_id: id, name: demo.demoCustomers.find((c) => c.id === id)?.name ?? "", invoices: n.get(id), total: round(t) }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function topSuppliers(from, to, limit = 10) {
  const rows = postedPurchases().filter((p) => inRange(p.purchase_date, from, to));
  const total = sumBy(rows, (p) => p.supplier_id, (p) => p.total);
  const n = sumBy(rows, (p) => p.supplier_id, () => 1);
  return [...total.entries()]
    .map(([id, t]) => ({ supplier_id: id, name: demo.demoSuppliers.find((s) => s.id === id)?.name ?? "", bills: n.get(id), total: round(t) }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function topProducts(from, to, limit = 5) {
  const ids = new Set(postedSales().filter((s) => inRange(s.sale_date, from, to)).map((s) => s.id));
  const lines = demo.demoSaleLines.filter((l) => ids.has(l.sale_id));
  const qty = sumBy(lines, (l) => l.item_id, (l) => l.qty);
  const amt = sumBy(lines, (l) => l.item_id, (l) => l.amount);
  return [...amt.entries()]
    .map(([id, a]) => ({ item_id: id, name: item(id)?.name ?? "", unit: item(id)?.unit ?? "", qty: qty.get(id), amount: round(a) }))
    .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/** Finished-goods categories in their unit, in category order. */
function finishedCategories() {
  const seen = new Map();
  for (const c of demo.demoCategories.filter((x) => x.kind === "finished" && x.active).sort((a, b) => a.sort_order - b.sort_order)) {
    for (const it of demo.demoItems.filter((i) => i.kind === "finished" && i.category_id === c.id)) {
      const key = `${c.id}|${it.unit}`;
      if (!seen.has(key)) seen.set(key, { category_id: c.id, category: c.name, unit: it.unit });
    }
  }
  return [...seen.values()];
}

export function productionSeries(from, to, grain) {
  const runs = postedRuns().filter((r) => inRange(r.run_date, from, to));
  const key = (r) => `${truncDate(r.run_date, grain)}|${item(r.item_id).category_id}|${r.unit}`;
  const qty = sumBy(runs, key, (r) => r.qty_made);
  const n = sumBy(runs, key, () => 1);
  const ps = periods(from, to, grain);
  return finishedCategories().flatMap((c) =>
    ps.map((period) => {
      const k = `${period}|${c.category_id}|${c.unit}`;
      return { period, category_id: c.category_id, category: c.category, unit: c.unit, qty: qty.get(k) ?? 0, runs: n.get(k) ?? 0 };
    }),
  );
}

export function productionByProduct(from, to) {
  const runs = postedRuns().filter((r) => inRange(r.run_date, from, to));
  const qty = sumBy(runs, (r) => r.item_id, (r) => r.qty_made);
  const n = sumBy(runs, (r) => r.item_id, () => 1);
  const order = (id) => demo.demoCategories.find((c) => c.id === item(id).category_id)?.sort_order ?? 0;
  return [...qty.entries()]
    .map(([id, q]) => ({ item_id: id, name: item(id).name, category: item(id).category_name, unit: item(id).unit, qty: q, runs: n.get(id) }))
    .sort((a, b) => order(a.item_id) - order(b.item_id) || b.qty - a.qty || a.name.localeCompare(b.name));
}

function consumptionInRange(from, to) {
  const runs = new Map(postedRuns().filter((r) => inRange(r.run_date, from, to)).map((r) => [r.id, r]));
  return demo.demoProductionConsumption.filter((c) => runs.has(c.run_id)).map((c) => ({ ...c, run_date: runs.get(c.run_id).run_date }));
}

export function materialUse(from, to, grain) {
  const rows = consumptionInRange(from, to);
  const ids = [...new Set(rows.map((r) => r.raw_item_id))].sort((a, b) => item(a).name.localeCompare(item(b).name));
  const key = (r) => `${truncDate(r.run_date, grain)}|${r.raw_item_id}`;
  const used = sumBy(rows, key, (r) => r.qty);
  const exp = sumBy(rows.filter((r) => r.expected_qty !== null), key, (r) => r.expected_qty);
  const ps = periods(from, to, grain);
  return ids.flatMap((id) =>
    ps.map((period) => {
      const k = `${period}|${id}`;
      return { period, item_id: id, name: item(id).name, unit: item(id).unit, used: round(used.get(k) ?? 0, 3), expected: exp.has(k) ? round(exp.get(k), 3) : null };
    }),
  );
}

export function materialSummary(from, to) {
  const rows = consumptionInRange(from, to);
  const ids = [...new Set(rows.map((r) => r.raw_item_id))];
  return ids
    .map((id) => {
      const mine = rows.filter((r) => r.raw_item_id === id);
      const priced = mine.filter((r) => r.expected_qty !== null);
      const used = round(mine.reduce((t, r) => t + r.qty, 0), 3);
      const expected = priced.length ? round(priced.reduce((t, r) => t + r.expected_qty, 0), 3) : null;
      const difference = priced.length ? round(priced.reduce((t, r) => t + r.qty - r.expected_qty, 0), 3) : null;
      return {
        item_id: id, name: item(id).name, unit: item(id).unit, used, expected, difference,
        difference_pct: expected ? round((100 * difference) / expected, 1) : null,
        runs: new Set(mine.map((r) => r.run_id)).size,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Like the item_costs view. */
export function itemCosts() {
  const priced = new Set(postedPurchases().map((p) => p.id));
  const lines = demo.demoPurchaseLines.filter((l) => priced.has(l.purchase_id));
  const amt = sumBy(lines, (l) => l.item_id, (l) => l.amount);
  const qty = sumBy(lines, (l) => l.item_id, (l) => l.qty);
  const raw = new Map([...amt.keys()].map((id) => [id, amt.get(id) / qty.get(id)]));
  const runs = postedRuns();
  const out = new Map();
  for (const it of demo.demoItems) {
    if (it.kind === "raw") {
      out.set(it.id, { unit_cost: round(raw.get(it.id) ?? 0, 4), cost_known: raw.has(it.id) });
      continue;
    }
    const mine = runs.filter((r) => r.item_id === it.id);
    const made = mine.reduce((t, r) => t + r.qty_made, 0);
    const cons = demo.demoProductionConsumption.filter((c) => mine.some((r) => r.id === c.run_id));
    const cost = cons.reduce((t, c) => t + c.qty * (raw.get(c.raw_item_id) ?? 0), 0);
    const allPriced = cons.length > 0 && cons.every((c) => raw.has(c.raw_item_id));
    out.set(it.id, { unit_cost: made > 0 ? round(cost / made, 4) : 0, cost_known: allPriced && made > 0 });
  }
  return out;
}

export function stockValue() {
  const costs = itemCosts();
  const groups = new Map();
  for (const it of demo.demoItems.filter((i) => i.active)) {
    const g = groups.get(it.category_id) ?? { category_id: it.category_id, category: it.category_name, kind: it.kind, items: 0, value: 0, unpriced: 0 };
    const c = costs.get(it.id);
    g.items += 1;
    g.value += Math.max(it.on_hand, 0) * c.unit_cost;
    if (it.on_hand > 0 && !c.cost_known) g.unpriced += 1;
    groups.set(it.category_id, g);
  }
  return [...groups.values()].map((g) => ({ ...g, value: round(g.value) })).sort((a, b) => b.value - a.value || a.category.localeCompare(b.category));
}

/** Demo stock movements, built from the posted documents. */
function demoFlowRows() {
  const rows = [];
  const purchases = new Map(postedPurchases().map((p) => [p.id, p]));
  for (const l of demo.demoPurchaseLines) if (purchases.has(l.purchase_id)) rows.push({ d: purchases.get(l.purchase_id).purchase_date, item_id: l.item_id, qty: l.qty });
  const sales = new Map(postedSales().map((s) => [s.id, s]));
  for (const l of demo.demoSaleLines) if (sales.has(l.sale_id)) rows.push({ d: sales.get(l.sale_id).sale_date, item_id: l.item_id, qty: -l.qty });
  const runs = new Map(postedRuns().map((r) => [r.id, r]));
  for (const r of runs.values()) rows.push({ d: r.run_date, item_id: r.item_id, qty: r.qty_made });
  for (const c of demo.demoProductionConsumption) if (runs.has(c.run_id)) rows.push({ d: runs.get(c.run_id).run_date, item_id: c.raw_item_id, qty: -c.qty });
  return rows;
}

export function stockFlow(from, to, grain) {
  const costs = itemCosts();
  const rows = demoFlowRows().filter((r) => inRange(r.d, from, to));
  const vin = sumBy(rows.filter((r) => r.qty > 0), (r) => truncDate(r.d, grain), (r) => r.qty * (costs.get(r.item_id)?.unit_cost ?? 0));
  const vout = sumBy(rows.filter((r) => r.qty < 0), (r) => truncDate(r.d, grain), (r) => -r.qty * (costs.get(r.item_id)?.unit_cost ?? 0));
  return periods(from, to, grain).map((period) => ({ period, value_in: round(vin.get(period) ?? 0), value_out: round(vout.get(period) ?? 0) }));
}

const daysBetween = (a, b) => Math.round((asDate(b) - asDate(a)) / 86400000);
const bucketOf = (d, asOf) => (d === null || daysBetween(d, asOf) > 60 ? "Over 60 days" : daysBetween(d, asOf) > 30 ? "31 to 60 days" : "0 to 30 days");

export function ageing(asOf) {
  const out = [];
  const sides = [
    ["receivable", demo.demoCustomerBalances, postedSales().map((s) => ({ pid: s.customer_id, d: s.sale_date, amt: s.total, ts: s.created_at }))],
    ["payable", demo.demoSupplierBalances, postedPurchases().map((p) => ({ pid: p.supplier_id, d: p.purchase_date, amt: p.total, ts: p.created_at }))],
  ];
  for (const [side, balances, docs] of sides) {
    for (const b of balances.filter((x) => x.balance > 0)) {
      const mine = docs.filter((x) => x.pid === b.id && x.d <= asOf).sort((x, y) => y.d.localeCompare(x.d) || y.ts.localeCompare(x.ts));
      let left = b.balance;
      const buckets = new Map();
      for (const x of mine) {
        const part = Math.max(Math.min(x.amt, left), 0);
        left -= x.amt;
        if (part > 0) buckets.set(bucketOf(x.d, asOf), (buckets.get(bucketOf(x.d, asOf)) ?? 0) + part);
      }
      const unexplained = Math.max(b.balance - mine.reduce((t, x) => t + x.amt, 0), 0);
      if (unexplained > 0) buckets.set("Over 60 days", (buckets.get("Over 60 days") ?? 0) + unexplained);
      for (const [bucket, amount] of [...buckets.entries()].sort((x, y) => x[0].localeCompare(y[0]))) {
        out.push({ side, party_id: b.id, name: b.name, bucket, amount: round(amount) });
      }
    }
  }
  return out.sort((a, b) => a.side.localeCompare(b.side) || a.name.localeCompare(b.name) || a.bucket.localeCompare(b.bucket));
}

export function profit(from, to, grain) {
  const costs = itemCosts();
  const sales = postedSales().filter((s) => inRange(s.sale_date, from, to));
  const byId = new Map(sales.map((s) => [s.id, s]));
  const lines = demo.demoSaleLines.filter((l) => byId.has(l.sale_id));
  const rev = sumBy(sales, (s) => truncDate(s.sale_date, grain), (s) => s.subtotal - s.discount);
  const cost = sumBy(lines, (l) => truncDate(byId.get(l.sale_id).sale_date, grain), (l) => l.qty * (costs.get(l.item_id)?.unit_cost ?? 0));
  const unpriced = sumBy(lines.filter((l) => !costs.get(l.item_id)?.cost_known), (l) => truncDate(byId.get(l.sale_id).sale_date, grain), () => 1);
  return periods(from, to, grain).map((period) => {
    const r = round(rev.get(period) ?? 0);
    const c = round(cost.get(period) ?? 0);
    return { period, revenue: r, cost: c, gross_profit: round(r - c), unpriced_lines: unpriced.get(period) ?? 0 };
  });
}
