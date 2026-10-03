import Link from "next/link";
import { Home, Layers, Package, TriangleAlert, CircleX, Boxes, ArrowRight } from "lucide-react";
import { requirePageRole } from "@/app/_lib/helpers";
import { getLowStockAlerts, getStockCounts } from "@/app/_lib/data-service";
import { formatQtyUnit } from "@/app/_lib/format-helpers";
import StockStatus from "@/app/_components/admin/StockStatus";

export const metadata = { title: "Dashboard" };

function KpiCard({ icon: Icon, value, label, tone, total, href }) {
  const tones = {
    primary: ["bg-[#dcfce7] text-[#16a34a] dark:bg-[#14532d] dark:text-[#4ade80]", "bg-primary"],
    info: ["bg-[#dbeafe] text-[#2563eb] dark:bg-[#1e3a5f] dark:text-[#60a5fa]", "bg-info"],
    warning: ["bg-[#fef3c7] text-[#d97706] dark:bg-[#451a03] dark:text-[#fcd34d]", "bg-warning"],
    danger: ["bg-[#fee2e2] text-[#dc2626] dark:bg-[#450a0a] dark:text-[#f87171]", "bg-danger"],
  };
  const [tile, bar] = tones[tone];
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <Link href={href} className="card block p-5 hover:shadow-md">
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tile}`}>
        <Icon size={21} strokeWidth={1.9} aria-hidden />
      </span>
      <p className="num mt-4 text-[28px] font-extrabold leading-none tracking-tight text-heading">{value}</p>
      <p className="mt-2 text-[13px] font-medium uppercase tracking-[0.04em] text-muted">{label}</p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-border" aria-hidden>
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </Link>
  );
}

export default async function Dashboard({ searchParams }) {
  const user = await requirePageRole();
  const { denied } = await searchParams;
  const [all, raw, finished, alerts] = await Promise.all([
    getStockCounts(),
    getStockCounts("raw"),
    getStockCounts("finished"),
    getLowStockAlerts(),
  ]);
  const lowCount = all.low + all.out;
  const firstName = user.full_name.split(" ")[0];

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
          <Link href="/admin/stock?status=low" className="inline-flex min-h-[40px] items-center gap-2 rounded-[10px] border border-white bg-white px-4 text-[13px] font-bold text-primary shadow-sm hover:-translate-y-px">
            <TriangleAlert size={15} aria-hidden /> Low stock
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
        <KpiCard icon={Layers} value={raw.total} label="Raw materials" tone="primary" total={all.total} href="/admin/raw-materials" />
        <KpiCard icon={Package} value={finished.total} label="Products" tone="info" total={all.total} href="/admin/products" />
        <KpiCard icon={TriangleAlert} value={all.low} label="Low stock" tone="warning" total={all.total} href="/admin/stock?status=low" />
        <KpiCard icon={CircleX} value={all.out} label="Out of stock" tone="danger" total={all.total} href="/admin/stock?status=out" />
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fee2e2] text-danger dark:bg-[#450a0a]">
              <TriangleAlert size={18} aria-hidden />
            </span>
            <div>
              <h2 className="card-title">Stock alerts</h2>
              <p className="text-xs text-muted">Items at or below their low-stock level</p>
            </div>
          </div>
          <Link href="/admin/stock?status=low" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            View all <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
        {alerts.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">Nothing is low. Good.</p>
        ) : (
          <ul className="divide-y divide-border">
            {alerts.map((a) => (
              <li key={a.id}>
                <Link href={`/admin/stock/${a.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 hover:bg-background">
                  <span>
                    <span className="block font-semibold text-heading">{a.name}</span>
                    <span className="text-xs text-muted">{a.kind === "raw" ? "Raw material" : "Product"}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="num text-sm font-bold text-heading">{formatQtyUnit(a.on_hand, a.unit)}</span>
                    <StockStatus status={a.stock_status} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="rounded-xl border border-dashed border-border px-4 py-3 text-center text-sm text-muted">
        Sales, customers and the dashboard charts are added in the next phases.
      </p>
    </div>
  );
}
