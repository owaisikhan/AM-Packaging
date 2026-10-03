import "server-only";
// The Reports page and its CSV download are built from the same sections, so
// the figures on screen and in the file always agree. Each section carries
// its chart settings and the same figures as a table of formatted text.
import {
  getAgeing,
  getMaterialSummary,
  getMaterialUse,
  getPartyBalances,
  getProductionByProduct,
  getProductionSeries,
  getProfit,
  getStockFlow,
  getStockValue,
  getTopCustomers,
  getTopProducts,
  getTopSuppliers,
  getTradeSeries,
} from "./data-service";
import { periodView } from "./chart-data";
import { addDays, addMonths, daysBetween, formatDate, startOfMonth } from "./date-helpers";
import { formatMoney as fullMoney, formatQty, formatQtyUnit } from "./format-helpers";

// Reports show whole rupees; paisa from averages only add noise.
const formatMoney = (v) => fullMoney(Math.round(Number(v) || 0));

export const REPORT_TABS = [
  { id: "sales", label: "Sales" },
  { id: "purchases", label: "Purchases" },
  { id: "production", label: "Production" },
  { id: "materials", label: "Raw material use" },
  { id: "stock", label: "Stock" },
  { id: "balances", label: "Receivables & Payables" },
  { id: "profit", label: "Profit" },
];

export const RANGE_PRESETS = [
  { value: "30d", label: "Last 30 days" },
  { value: "month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "90d", label: "Last 3 months" },
  { value: "year", label: "This year" },
  { value: "custom", label: "Pick dates" },
];

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** The date range and grouping a report covers, from the query string. */
export function resolveRange(sp, today) {
  let preset = RANGE_PRESETS.some((p) => p.value === sp.range) ? sp.range : "30d";
  let from;
  let to = today;
  if (preset === "custom" && ISO.test(sp.from ?? "") && ISO.test(sp.to ?? "")) {
    [from, to] = sp.from <= sp.to ? [sp.from, sp.to] : [sp.to, sp.from];
  } else {
    if (preset === "custom") preset = "30d";
    if (preset === "month") from = startOfMonth(today);
    else if (preset === "last-month") {
      from = addMonths(today, -1);
      to = addDays(startOfMonth(today), -1);
    } else if (preset === "90d") from = addDays(today, -89);
    else if (preset === "year") from = `${today.slice(0, 4)}-01-01`;
    else from = addDays(today, -29);
  }
  const days = daysBetween(from, to) + 1;
  const auto = days <= 45 ? "day" : days <= 190 ? "week" : "month";
  const grain = ["day", "week", "month"].includes(sp.group) && !(sp.group === "day" && days > 400) ? sp.group : auto;
  return { preset, from, to, grain, groupChosen: grain !== auto, days, label: `${formatDate(from)} to ${formatDate(to)}` };
}

const GRAIN_WORD = { day: "day", week: "week", month: "month" };
const per = (r) => `per ${GRAIN_WORD[r.grain]}`;

function sum(rows, key) {
  return rows.reduce((t, r) => t + (Number(r[key]) || 0), 0);
}

function rankTable(first, rows, cols) {
  return {
    columns: [{ label: first }, ...cols.map((c) => ({ label: c.label, align: "right" }))],
    rows: rows.map((r) => [r.label, ...cols.map((c) => c.value(r))]),
  };
}

// ---------------------------------------------------------------
// One builder per tab. Each returns { cards, sections }.
// cards: [{ label, value, note, tone }]
// sections: [{ id, kind, title, subtitle, table, ...chart props }]
// ---------------------------------------------------------------

async function salesReport(r) {
  const [series, customers, products] = await Promise.all([
    getTradeSeries(r),
    getTopCustomers({ ...r, limit: 10 }),
    getTopProducts({ ...r, limit: 10 }),
  ]);
  const total = sum(series, "sales");
  const invoices = sum(series, "invoices");
  const customerRows = customers.map((c) => ({ key: c.customer_id, label: c.name, value: c.total, display: formatMoney(c.total), sub: `${c.invoices} ${c.invoices === 1 ? "invoice" : "invoices"}`, href: `/admin/customers/${c.customer_id}` }));
  const productRows = products.map((p) => ({ key: p.item_id, label: p.name, value: p.amount, display: formatMoney(p.amount), sub: formatQtyUnit(p.qty, p.unit), href: `/admin/stock/${p.item_id}` }));
  return {
    cards: [
      { label: "Total sales", value: formatMoney(total), tone: "primary" },
      { label: "Invoices", value: formatQty(invoices), tone: "info", plain: true },
      { label: "Average invoice", value: formatMoney(invoices ? total / invoices : 0), tone: "warning" },
    ],
    sections: [
      {
        id: "sales-trend", kind: "columns", wide: true, title: "Sales", subtitle: `Invoice totals ${per(r)}, void invoices left out`,
        series: [{ key: "sales", label: "Sales", color: "--series-1" }], format: "money",
        ...periodView(series, r.grain, [{ key: "sales", label: "Sales" }, { key: "invoices", label: "Invoices", format: "qty" }]),
      },
      {
        id: "top-customers", kind: "rank", title: "Top 10 customers", subtitle: "By invoice total in this period",
        rows: customerRows, empty: customerRows.length === 0,
        table: rankTable("Customer", customerRows, [{ label: "Invoices", value: (x) => x.sub.split(" ")[0] }, { label: "Total", value: (x) => x.display }]),
      },
      {
        id: "top-products", kind: "rank", title: "Top 10 products", subtitle: "By sales value in this period",
        rows: productRows, empty: productRows.length === 0,
        table: rankTable("Product", productRows, [{ label: "Quantity", value: (x) => x.sub }, { label: "Sales", value: (x) => x.display }]),
      },
    ],
  };
}

async function purchasesReport(r) {
  const [series, suppliers] = await Promise.all([getTradeSeries(r), getTopSuppliers({ ...r, limit: 10 })]);
  const total = sum(series, "purchases");
  const bills = sum(series, "bills");
  const rows = suppliers.map((s) => ({ key: s.supplier_id, label: s.name, value: s.total, display: formatMoney(s.total), sub: `${s.bills} ${s.bills === 1 ? "bill" : "bills"}`, href: `/admin/suppliers/${s.supplier_id}` }));
  return {
    cards: [
      { label: "Total purchases", value: formatMoney(total), tone: "info" },
      { label: "Bills", value: formatQty(bills), tone: "primary", plain: true },
      { label: "Average bill", value: formatMoney(bills ? total / bills : 0), tone: "warning" },
    ],
    sections: [
      {
        id: "purchase-trend", kind: "columns", wide: true, title: "Purchases", subtitle: `Bill totals ${per(r)}, void bills left out`,
        series: [{ key: "purchases", label: "Purchases", color: "--series-2" }], format: "money",
        ...periodView(series, r.grain, [{ key: "purchases", label: "Purchases" }, { key: "bills", label: "Bills", format: "qty" }]),
      },
      {
        id: "top-suppliers", kind: "rank", wide: true, title: "Top 10 suppliers", subtitle: "By bill total in this period", color: "--series-2",
        rows, empty: rows.length === 0,
        table: rankTable("Supplier", rows, [{ label: "Bills", value: (x) => x.sub.split(" ")[0] }, { label: "Total", value: (x) => x.display }]),
      },
    ],
  };
}

async function productionReport(r) {
  const [series, byProduct] = await Promise.all([getProductionSeries(r), getProductionByProduct(r)]);
  const cats = [];
  for (const row of series) {
    let c = cats.find((x) => x.id === row.category_id && x.unit === row.unit);
    if (!c) cats.push((c = { id: row.category_id, name: row.category, unit: row.unit, rows: [] }));
    c.rows.push(row);
  }
  return {
    cards: cats.map((c, i) => ({
      label: `${c.name} made`, value: formatQtyUnit(sum(c.rows, "qty"), c.unit), note: `${sum(c.rows, "runs")} runs`,
      tone: ["primary", "info", "warning"][i % 3], plain: true,
    })),
    sections: [
      ...cats.map((c) => ({
        id: `production-${c.id}`, kind: "columns", title: `${c.name} (${c.unit})`, subtitle: `Made ${per(r)}, in ${c.unit}`,
        series: [{ key: "qty", label: `${c.name} made`, color: "--series-1" }], format: "qty", unit: c.unit,
        emptyText: `No ${c.name.toLowerCase()} made in this period.`,
        ...periodView(c.rows, r.grain, [{ key: "qty", label: `Made (${c.unit})`, format: "qty" }, { key: "runs", label: "Runs", format: "qty" }]),
      })),
      {
        id: "production-products", kind: "table", wide: true, title: "Made per product", subtitle: "Every product made in this period",
        empty: byProduct.length === 0,
        table: {
          columns: [{ label: "Product" }, { label: "Type" }, { label: "Made", align: "right" }, { label: "Runs", align: "right" }],
          rows: byProduct.map((p) => [p.name, p.category, formatQtyUnit(p.qty, p.unit), formatQty(p.runs)]),
        },
      },
    ],
  };
}

async function materialsReport(r) {
  const [use, summary] = await Promise.all([getMaterialUse(r), getMaterialSummary(r)]);
  const materials = summary.map((m) => {
    const rows = use.filter((u) => u.item_id === m.item_id);
    return {
      id: m.item_id, name: m.name, unit: m.unit,
      ...periodView(rows, r.grain, [
        { key: "used", label: `Used (${m.unit})`, format: "qty" },
        { key: "expected", label: `Recipe (${m.unit})`, format: "qty" },
      ]),
    };
  });
  const withRecipe = summary.filter((m) => m.difference_pct !== null);
  const over = withRecipe.filter((m) => m.difference > 0);
  const diffRows = withRecipe
    .slice()
    .sort((a, b) => b.difference_pct - a.difference_pct)
    .map((m) => ({
      key: m.item_id, label: m.name, value: m.difference_pct,
      display: `${m.difference_pct > 0 ? "+" : ""}${formatQty(m.difference_pct)}%`,
      sub: m.difference === 0 ? "as recipe" : `${m.difference > 0 ? "+" : "-"}${formatQtyUnit(Math.abs(m.difference), m.unit)} ${m.difference > 0 ? "over" : "under"}`,
    }));
  return {
    cards: [
      { label: "Materials used", value: formatQty(summary.length), tone: "info", plain: true },
      { label: "Used more than the recipe", value: formatQty(over.length), note: over.length ? over.map((m) => m.name).join(", ") : "None", tone: over.length ? "danger" : "primary", plain: true },
      { label: "Runs counted", value: formatQty(Math.max(0, ...summary.map((m) => m.runs))), tone: "warning", plain: true },
    ],
    sections: [
      {
        id: "material-use", kind: "material", wide: true, title: "Used vs recipe", subtitle: `One material at a time, ${per(r)}`,
        materials, empty: materials.length === 0, emptyText: "No raw material was used in this period.",
      },
      {
        id: "material-difference", kind: "rank", diverging: true, title: "Difference from the recipe",
        subtitle: "Right of the line: more used than the recipe. Left: less.",
        rows: diffRows, empty: diffRows.length === 0, emptyText: "No runs with a recipe in this period.",
        table: rankTable("Material", diffRows, [{ label: "Difference", value: (x) => x.sub }, { label: "Percent", value: (x) => x.display }]),
      },
      {
        id: "material-summary", kind: "table", title: "Every material", subtitle: "Totals over the whole period",
        empty: summary.length === 0,
        table: {
          columns: [{ label: "Material" }, { label: "Used", align: "right" }, { label: "Recipe", align: "right" }, { label: "Difference", align: "right" }],
          rows: summary.map((m) => [
            m.name,
            formatQtyUnit(m.used, m.unit),
            m.expected === null ? "No recipe" : formatQtyUnit(m.expected, m.unit),
            m.difference === null ? "None" : `${m.difference > 0 ? "+" : ""}${formatQtyUnit(m.difference, m.unit)}`,
          ]),
        },
      },
    ],
  };
}

async function stockReport(r) {
  const [value, flow] = await Promise.all([getStockValue(), getStockFlow(r)]);
  const total = sum(value, "value");
  const unpriced = sum(value, "unpriced");
  const rows = value.map((v) => ({
    key: v.category_id, label: v.category, value: v.value, display: formatMoney(v.value),
    sub: `${v.kind === "raw" ? "Raw" : "Product"}, ${v.items} ${v.items === 1 ? "item" : "items"}${v.unpriced ? `, ${v.unpriced} without a cost yet` : ""}`,
  }));
  return {
    cards: [
      { label: "Stock value now", value: formatMoney(total), tone: "primary" },
      { label: "Raw materials", value: formatMoney(sum(value.filter((v) => v.kind === "raw"), "value")), tone: "info" },
      { label: "Products", value: formatMoney(sum(value.filter((v) => v.kind === "finished"), "value")), tone: "warning" },
    ],
    sections: [
      {
        id: "stock-value", kind: "rank", title: "Stock value by category", subtitle: "What is in stock today, at average cost",
        rows, empty: total === 0, emptyText: "Nothing in stock has a cost yet.",
        footnote: unpriced ? `${unpriced} ${unpriced === 1 ? "item is" : "items are"} counted at zero: no purchase price (raw) or production cost (product) yet.` : null,
        table: rankTable("Category", rows, [{ label: "Items", value: (x) => x.sub }, { label: "Value", value: (x) => x.display }]),
      },
      {
        id: "stock-flow", kind: "columns", title: "Stock in and out", subtitle: `Value ${per(r)} at average cost: purchases and production in, sales and materials used out`,
        series: [{ key: "value_in", label: "In", color: "--series-1" }, { key: "value_out", label: "Out", color: "--series-2" }], format: "money",
        ...periodView(flow, r.grain, [{ key: "value_in", label: "In" }, { key: "value_out", label: "Out" }]),
      },
    ],
  };
}

const BUCKETS = [
  { key: "0 to 30 days", color: "--age-1" },
  { key: "31 to 60 days", color: "--age-2" },
  { key: "Over 60 days", color: "--age-3" },
];

async function balancesReport(r, today) {
  const [ageing, customers, suppliers] = await Promise.all([getAgeing(today), getPartyBalances("customer"), getPartyBalances("supplier")]);
  const side = (s) => BUCKETS.map((b) => ({ key: b.key, label: b.key, color: b.color, value: sum(ageing.filter((a) => a.side === s && a.bucket === b.key), "amount") }));
  const receivable = side("receivable");
  const payable = side("payable");
  const rec = sum(receivable, "value");
  const pay = sum(payable, "value");
  const toRows = (rows, kind) => rows.map((x) => ({ key: x.id, label: x.name, value: x.balance, display: formatMoney(x.balance), href: `/admin/${kind}/${x.id}` }));
  const custRows = toRows(customers, "customers");
  const supRows = toRows(suppliers, "suppliers");
  const parties = [...new Set(ageing.map((a) => `${a.side}|${a.name}`))];
  return {
    asOf: true,
    cards: [
      { label: "Customers owe you", value: formatMoney(rec), tone: "danger" },
      { label: "You owe suppliers", value: formatMoney(pay), tone: "warning" },
      { label: "Owed to you for over 60 days", value: formatMoney(receivable[2].value), tone: "danger" },
    ],
    sections: [
      {
        id: "ageing", kind: "stacks", wide: true, title: "How old the money owed is",
        subtitle: "Payments are taken to clear the oldest bills first. An opening balance counts as over 60 days.",
        stacks: [
          { key: "rec", title: "Customers owe you", total: formatMoney(rec), segments: receivable },
          { key: "pay", title: "You owe suppliers", total: formatMoney(pay), segments: payable },
        ],
        empty: rec + pay === 0, emptyText: "Nobody owes anything. All settled.",
        table: {
          columns: [{ label: "Who" }, { label: "Side" }, ...BUCKETS.map((b) => ({ label: b.key, align: "right" }))],
          rows: parties.map((p) => {
            const [s, name] = p.split("|");
            return [name, s === "receivable" ? "Owes you" : "You owe", ...BUCKETS.map((b) => formatMoney(sum(ageing.filter((a) => a.side === s && a.name === name && a.bucket === b.key), "amount")))];
          }),
        },
      },
      {
        id: "customer-balances", kind: "rank", title: "Customers who owe the most", subtitle: "Top 10 balances today", color: "--series-1",
        rows: custRows, empty: custRows.length === 0, emptyText: "No customer owes you anything.",
        table: rankTable("Customer", custRows, [{ label: "Owes you", value: (x) => x.display }]),
      },
      {
        id: "supplier-balances", kind: "rank", title: "Suppliers you owe the most", subtitle: "Top 10 balances today", color: "--series-2",
        rows: supRows, empty: supRows.length === 0, emptyText: "You owe no supplier anything.",
        table: rankTable("Supplier", supRows, [{ label: "You owe", value: (x) => x.display }]),
      },
    ],
  };
}

async function profitReport(r) {
  const rows = await getProfit(r);
  const revenue = sum(rows, "revenue");
  const cost = sum(rows, "cost");
  const unpriced = sum(rows, "unpriced_lines");
  const margin = revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;
  return {
    cards: [
      { label: "Revenue", value: formatMoney(revenue), tone: "primary" },
      { label: "Cost of goods sold", value: formatMoney(cost), tone: "info" },
      { label: "Gross profit", value: formatMoney(revenue - cost), note: `${formatQty(Math.round(margin * 10) / 10)}% of revenue`, tone: revenue - cost < 0 ? "danger" : "warning" },
    ],
    sections: [
      {
        id: "profit", kind: "columns", wide: true, title: "Revenue, cost and gross profit", subtitle: `${per(r)[0].toUpperCase()}${per(r).slice(1)}, all in rupees on one scale`,
        series: [{ key: "revenue", label: "Revenue", color: "--series-1" }, { key: "cost", label: "Cost", color: "--series-2" }],
        line: { key: "gross_profit", label: "Gross profit", color: "--series-3" },
        format: "money",
        footnote: `Revenue is what goods sold for, less discount (GST and freight left out). Cost is each product's average material cost from production, with materials at their average purchase price.${unpriced ? ` ${unpriced} invoice ${unpriced === 1 ? "line has" : "lines have"} no cost yet and count as zero cost, so profit is shown higher than it is.` : ""}`,
        ...periodView(rows, r.grain, [{ key: "revenue", label: "Revenue" }, { key: "cost", label: "Cost" }, { key: "gross_profit", label: "Gross profit" }]),
      },
    ],
  };
}

const BUILDERS = {
  sales: salesReport,
  purchases: purchasesReport,
  production: productionReport,
  materials: materialsReport,
  stock: stockReport,
  balances: balancesReport,
  profit: profitReport,
};

export async function buildReport(tab, range, today) {
  const build = BUILDERS[tab] ?? BUILDERS.sales;
  return build(range, today);
}

/** The report as CSV text: each section's table under its title. */
export function reportToCsv(tabLabel, range, report) {
  const cell = (v) => {
    const s = String(v ?? "");
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [cell(`${tabLabel} report`), cell(report.asOf ? `As of ${formatDate(range.to)}` : range.label), ""];
  for (const s of report.sections) {
    if (!s.table) continue;
    lines.push(cell(s.title));
    lines.push(s.table.columns.map((c) => cell(c.label)).join(","));
    for (const row of s.table.rows) lines.push(row.map(cell).join(","));
    lines.push("");
  }
  return lines.join("\r\n");
}
