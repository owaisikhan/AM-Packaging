import Link from "next/link";
import { Home, Layers, TriangleAlert, CircleX, CircleCheck, Boxes, ArrowRight, Banknote, ShoppingCart, Factory, Wallet } from "lucide-react";
import { requirePageRole } from "@/app/_lib/helpers";
import {
  getCustomerTotals,
  getLowStockAlerts,
  getProductionSeries,
  getStockCounts,
  getSupplierTotals,
  getTopProducts,
  getTradeSeries,
} from "@/app/_lib/data-service";
import { formatCompactMoney, formatMoney, formatQty, formatQtyUnit } from "@/app/_lib/format-helpers";
import { addDays, addMonths, todayISO } from "@/app/_lib/date-helpers";
import { periodView } from "@/app/_lib/chart-data";
import StockStatus from "@/app/_components/admin/StockStatus";
import MoneyRow from "@/app/_components/ui/MoneyRow";
import SalesPurchasesCard from "@/app/_components/dashboard/SalesPurchasesCard";
import ProductionCard from "@/app/_components/dashboard/ProductionCard";
import DonutChart from "@/app/_components/charts/DonutChart";
import RankBars from "@/app/_components/charts/RankBars";

export const metadata = { title: "Dashboard" };

const TONES = {
  primary: ["bg-[#dcfce7] text-[#16a34a] dark:bg-[#14532d] dark:text-[#4ade80]", "bg-primary"],
  info: ["bg-[#dbeafe] text-[#2563eb] dark:bg-[#1e3a5f] dark:text-[#60a5fa]", "bg-info"],
  warning: ["bg-[#fef3c7] text-[#d97706] dark:bg-[#451a03] dark:text-[#fcd34d]", "bg-warning"],
  danger: ["bg-[#fee2e2] text-[#dc2626] dark:bg-[#450a0a] dark:text-[#f87171]", "bg-danger"],
};

// A KPI card from the reference: icon tile, big figure, uppercase label, and
// either a progress bar (share of all items) or a short note in words.
function KpiCard({ icon: Icon, value, label, note, tone, pct, href }) {
  const [tile, bar] = TONES[tone];
  return (
    <Link href={href} className="card block min-w-0 p-4 hover:shadow-md sm:p-5">
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tile}`}>
        <Icon size={21} strokeWidth={1.9} aria-hidden />
      </span>
      <p className="num mt-4 text-[19px] font-extrabold leading-none tracking-tight text-heading min-[400px]:text-[22px] sm:text-[28px]">{value}</p>
      <p className="mt-2 text-[13px] font-medium uppercase tracking-[0.04em] text-muted">{label}</p>
      {pct !== undefined ? (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-border" aria-hidden>
          <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
        </div>
      ) : (
        <p className="mt-3 text-xs text-secondary">{note}</p>
      )}
    </Link>
  );
}

const share = (n, total) => (total > 0 ? Math.min(100, Math.round((n / total) * 100)) : 0);

function CardHeader({ icon: Icon, tile, title, subtitle, href, linkLabel }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tile}`}>
          <Icon size={18} aria-hidden />
        </span>
        <div>
          <h2 className="card-title">{title}</h2>
          {subtitle ? <p className="text-xs text-muted">{subtitle}</p> : null}
        </div>
      </div>
      {href ? (
        <Link href={href} className="inline-flex min-h-[36px] items-center gap-1 text-sm font-semibold text-primary-ink hover:underline">
          {linkLabel} <ArrowRight size={15} aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}

export default async function Dashboard({ searchParams }) {
  const user = await requirePageRole();
  const isAdmin = user.role === "admin";
  const { denied } = await searchParams;
  const today = todayISO();
  const from30 = addDays(today, -29);

  const [all, raw, alerts, production, day, week, month, top, receivable, payable] = await Promise.all([
    getStockCounts(),
    getStockCounts("raw"),
    getLowStockAlerts(),
    getProductionSeries({ from: from30, to: today, grain: "day" }),
    isAdmin ? getTradeSeries({ from: from30, to: today, grain: "day" }) : null,
    isAdmin ? getTradeSeries({ from: addDays(today, -7 * 11), to: today, grain: "week" }) : null,
    isAdmin ? getTradeSeries({ from: addMonths(today, -11), to: today, grain: "month" }) : null,
    isAdmin ? getTopProducts({ from: addDays(today, -89), to: today, limit: 5 }) : null,
    isAdmin ? getCustomerTotals() : null,
    isAdmin ? getSupplierTotals() : null,
  ]);
  const lowCount = all.low + all.out;
  const firstName = user.full_name.split(" ")[0];

  // Production per category, each in its own unit
  const categories = [];
  for (const r of production) {
    let c = categories.find((x) => x.id === r.category_id && x.unit === r.unit);
    if (!c) categories.push((c = { id: r.category_id, name: r.category, unit: r.unit, rows: [] }));
    c.rows.push(r);
  }
  const productionCards = categories.map((c) => ({
    id: c.id,
    name: c.name,
    unit: c.unit,
    total: formatQtyUnit(c.rows.reduce((t, r) => t + r.qty, 0), c.unit),
    ...periodView(c.rows, "day", [{ key: "qty", label: "Made", format: "qty", unit: c.unit }]),
  }));
  const madeToday = production.filter((r) => r.period === today && r.qty > 0);
  const runsToday = madeToday.reduce((t, r) => t + r.runs, 0);

  const tradeFields = [
    { key: "sales", label: "Sales" },
    { key: "purchases", label: "Purchases" },
  ];
  const views = isAdmin
    ? {
        day: { subtitle: "Last 30 days, by invoice and bill totals", ...periodView(day, "day", tradeFields) },
        week: { subtitle: "Last 12 weeks, weeks start on Monday", ...periodView(week, "week", tradeFields) },
        month: { subtitle: "Last 12 months", ...periodView(month, "month", tradeFields) },
      }
    : null;
  const todayTrade = day?.[day.length - 1];
  const thisMonth = month?.[month.length - 1];
  const inStock = Math.max(all.total - all.low - all.out, 0);

  return (
    <div className="flex flex-col gap-6">
      {denied ? (
        <p role="alert" className="rounded-xl bg-[#fef3c7] px-4 py-3 text-sm font-medium text-[#b45309]">
          That page is for admins only.
        </p>
      ) : null}

      <section className="welcome-banner">
        <div className="relative z-10 flex items-start gap-4">
          <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] border border-white/20 bg-white/15">
            <Home size={24} aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-bold leading-tight tracking-tight">Welcome back, {firstName}!</h1>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-white/90">
              Here is what is happening in the factory today.{" "}
              {lowCount > 0 ? (
                <>
                  You have <strong className="rounded-md bg-white/20 px-2 py-0.5 font-bold text-white">{lowCount} items</strong> running low or out of stock.
                </>
              ) : (
                "Every item is above its low-stock level."
              )}
            </p>
          </div>
        </div>
        <div className="relative z-10 flex flex-wrap gap-2.5">
          <Link href="/admin/stock" className="inline-flex min-h-[40px] items-center gap-2 rounded-[10px] border border-white/25 bg-white/10 px-4 text-[13px] font-medium text-white hover:bg-white/20">
            <Boxes size={15} aria-hidden /> View stock
          </Link>
          <Link href="/admin/stock?status=low" className="inline-flex min-h-[40px] items-center gap-2 rounded-[10px] border border-white bg-white px-4 text-[13px] font-bold text-[#15803d] shadow-sm hover:-translate-y-px">
            <TriangleAlert size={15} aria-hidden /> Low stock
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
        {isAdmin ? (
          <>
            <KpiCard icon={Banknote} value={formatCompactMoney(todayTrade.sales)} label="Sales today" tone="primary" href="/admin/sales" note={`${todayTrade.invoices} ${todayTrade.invoices === 1 ? "invoice" : "invoices"}, ${formatMoney(todayTrade.sales)}`} />
            <KpiCard icon={ShoppingCart} value={formatCompactMoney(todayTrade.purchases)} label="Purchases today" tone="info" href="/admin/purchases" note={`${todayTrade.bills} ${todayTrade.bills === 1 ? "bill" : "bills"}, ${formatMoney(todayTrade.purchases)}`} />
          </>
        ) : null}
        <KpiCard
          icon={Factory}
          value={runsToday}
          label={runsToday === 1 ? "Production run today" : "Production runs today"}
          tone={isAdmin ? "warning" : "primary"}
          href="/admin/production"
          note={madeToday.length ? madeToday.map((r) => `${formatQtyUnit(r.qty, r.unit)} ${r.category.toLowerCase()}`).join(", ") : "Nothing made yet today"}
        />
        {isAdmin ? (
          <KpiCard icon={Wallet} value={formatCompactMoney(receivable.receivable)} label="To receive" tone="danger" href="/admin/customers?owing=1" note={`${receivable.owing} ${receivable.owing === 1 ? "customer owes" : "customers owe"} you`} />
        ) : (
          <>
            <KpiCard icon={Layers} value={raw.total} label="Raw materials" tone="info" pct={share(raw.total, all.total)} href="/admin/raw-materials" />
            <KpiCard icon={TriangleAlert} value={all.low} label="Low stock" tone="warning" pct={share(all.low, all.total)} href="/admin/stock?status=low" />
            <KpiCard icon={CircleX} value={all.out} label="Out of stock" tone="danger" pct={share(all.out, all.total)} href="/admin/stock?status=out" />
          </>
        )}
      </div>

      {isAdmin ? (
        <div className="grid gap-6 2xl:grid-cols-[1fr_360px]">
          <SalesPurchasesCard views={views} />
          <section className="card flex flex-col">
            <CardHeader icon={Banknote} tile="bg-primary-light text-primary-ink" title="This month" subtitle="Sales and purchases since the 1st, and what is owed now" href="/admin/reports" linkLabel="Reports" />
            <div className="flex flex-1 flex-col gap-3.5 p-5">
              <MoneyRow label={`Sales (${thisMonth.invoices} ${thisMonth.invoices === 1 ? "invoice" : "invoices"})`}>{formatMoney(thisMonth.sales)}</MoneyRow>
              <MoneyRow label={`Purchases (${thisMonth.bills} ${thisMonth.bills === 1 ? "bill" : "bills"})`}>{formatMoney(thisMonth.purchases)}</MoneyRow>
              <div className="my-1 border-t border-border" />
              <MoneyRow label="Customers owe you" tone="danger">{formatMoney(receivable.receivable)}</MoneyRow>
              <MoneyRow label="You owe suppliers" tone="danger">{formatMoney(payable.payable)}</MoneyRow>
              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                <Link href="/admin/customers?owing=1" className="btn-secondary min-h-[40px] flex-1 justify-center text-[13px]">Who owes you</Link>
                <Link href="/admin/suppliers?owing=1" className="btn-secondary min-h-[40px] flex-1 justify-center text-[13px]">Who you owe</Link>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <ProductionCard categories={productionCards} subtitle="Made per day, last 30 days" />
        <section className="card flex flex-col">
          <CardHeader icon={Boxes} tile="bg-[#dbeafe] text-[#2563eb] dark:bg-[#1e3a5f] dark:text-[#60a5fa]" title="Stock health" subtitle="Every active item, raw materials and products" href="/admin/stock" linkLabel="Stock" />
          <div className="flex flex-1 flex-col items-center justify-center gap-6 p-5 sm:flex-row sm:justify-around">
            <DonutChart
              centerValue={all.total}
              centerLabel="items"
              slices={[
                { key: "in", label: "In stock", value: inStock, color: "--status-good" },
                { key: "low", label: "Low stock", value: all.low, color: "--status-warn" },
                { key: "out", label: "Out of stock", value: all.out, color: "--status-bad" },
              ]}
            />
            <ul className="flex w-full max-w-[240px] flex-col gap-3 text-sm">
              {[
                ["In stock", inStock, CircleCheck, "--status-good", "/admin/stock?status=in"],
                ["Low stock", all.low, TriangleAlert, "--status-warn", "/admin/stock?status=low"],
                ["Out of stock", all.out, CircleX, "--status-bad", "/admin/stock?status=out"],
              ].map(([label, n, Icon, color, href]) => (
                <li key={label}>
                  <Link href={href} className="flex min-h-[40px] items-center justify-between gap-3 rounded-lg px-2 hover:bg-background">
                    <span className="flex items-center gap-2.5 text-secondary">
                      <span className="h-3 w-3 rounded-[3px]" style={{ background: `var(${color})` }} aria-hidden />
                      <Icon size={16} className="text-muted" aria-hidden />
                      {label}
                    </span>
                    <span className="num font-bold text-heading">
                      {n} <span className="text-xs font-medium text-muted">({share(n, all.total)}%)</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <div className={`grid gap-6 ${isAdmin ? "xl:grid-cols-2" : ""}`}>
        {isAdmin ? (
          <section className="card flex flex-col">
            <CardHeader icon={Banknote} tile="bg-primary-light text-primary-ink" title="Top 5 products sold" subtitle="Last 90 days, by sales value" href="/admin/reports?tab=sales" linkLabel="Sales report" />
            {top.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted">No sales in the last 90 days yet.</p>
            ) : (
              <div className="p-5">
                <RankBars rows={top.map((t) => ({ key: t.item_id, label: t.name, value: t.amount, display: formatMoney(t.amount), sub: formatQtyUnit(t.qty, t.unit), href: `/admin/stock/${t.item_id}` }))} />
              </div>
            )}
          </section>
        ) : null}
        <section className="card overflow-hidden">
          <CardHeader icon={TriangleAlert} tile="bg-[#fee2e2] text-danger-ink dark:bg-[#450a0a]" title="Stock alerts" subtitle="Items at or below their low-stock level" href="/admin/stock?status=low" linkLabel="View all" />
          {alerts.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">Nothing is low. Good.</p>
          ) : (
            <ul className="divide-y divide-border">
              {alerts.map((a) => {
                const level = Number(a.low_stock_level);
                const pct = level > 0 ? Math.min(100, Math.max(0, (Number(a.on_hand) / level) * 100)) : 0;
                return (
                  <li key={a.id}>
                    <Link href={`/admin/stock/${a.id}`} className="block px-5 py-3.5 hover:bg-background">
                      <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <span className="min-w-0">
                          <span className="block font-semibold text-heading">{a.name}</span>
                          <span className="text-xs text-muted">{a.kind === "raw" ? "Raw material" : "Product"}</span>
                        </span>
                        <span className="flex items-center gap-3">
                          <span className="num text-sm font-bold text-heading">{formatQtyUnit(a.on_hand, a.unit)}</span>
                          <StockStatus status={a.stock_status} />
                        </span>
                      </span>
                      <span className="mt-2 flex items-center gap-3">
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-border" aria-hidden>
                          <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: a.stock_status === "out" ? "var(--status-bad)" : "var(--status-warn)" }} />
                        </span>
                        <span className="num shrink-0 text-xs text-muted">low at {formatQty(level)}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
