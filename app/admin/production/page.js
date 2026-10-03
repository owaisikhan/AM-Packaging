import Link from "next/link";
import { Plus, Factory, CalendarDays, Package, Boxes } from "lucide-react";
import { requirePageRole } from "@/app/_lib/helpers";
import { getItemOptions, getProductionPage, getProductionTotals, PAGE_SIZE } from "@/app/_lib/data-service";
import { formatQty } from "@/app/_lib/format-helpers";
import { formatDate, todayISO } from "@/app/_lib/date-helpers";
import PageHeader from "@/app/_components/layout/PageHeader";
import StatCard from "@/app/_components/ui/StatCard";
import FilterBar from "@/app/_components/ui/FilterBar";
import Pagination from "@/app/_components/ui/Pagination";
import EmptyState from "@/app/_components/ui/EmptyState";
import RunStatus from "@/app/_components/admin/RunStatus";

export const metadata = { title: "Production" };

export default async function ProductionPage({ searchParams }) {
  await requirePageRole();
  const sp = await searchParams;

  const today = todayISO();
  const monthStart = `${today.slice(0, 8)}01`;
  const cardFrom = sp.from || (sp.to ? undefined : monthStart);
  const cardTo = sp.to || (sp.from ? undefined : today);
  const period = sp.from || sp.to ? "in these dates" : "this month";

  const [products, totals, todays, list] = await Promise.all([
    getItemOptions("finished"),
    getProductionTotals({ from: cardFrom, to: cardTo, item: sp.item }),
    getProductionTotals({ from: today, to: today, item: sp.item }),
    getProductionPage({ item: sp.item, status: sp.status, from: sp.from, to: sp.to, q: sp.q, page: sp.page }),
  ]);
  const page = Math.max(1, Number(sp.page) || 1);
  const madeText = totals.made.length ? totals.made.map((m) => `${formatQty(m.qty)} ${m.unit}`).join(" + ") : "None";
  const newButton = (
    <Link href="/admin/production/new" className="btn-primary">
      <Plus size={18} aria-hidden /> Record Production
    </Link>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Production"
        subtitle="Every manufacturing run: what was made and the raw materials it used. Saving a run adds the product to stock and takes the materials out."
        crumbs={[{ label: "Home", href: "/admin" }, { label: "Production" }]}
        actions={newButton}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard icon={Factory} label={`Runs ${period}`} value={totals.runs} tone="info" valueTone="plain" />
        <StatCard icon={CalendarDays} label="Runs today" value={todays.runs} tone="primary" />
        <StatCard icon={Package} label={`Products made ${period}`} value={totals.products} tone="warning" valueTone="plain" />
        <div className="stat-card col-span-2 max-sm:flex-col max-sm:items-start max-sm:gap-3 max-sm:p-4 xl:col-span-1">
          <span className="stat-icon bg-[rgb(34_181_115/0.1)] text-primary max-sm:h-10 max-sm:w-10 max-sm:rounded-xl">
            <Boxes size={22} strokeWidth={1.8} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-muted sm:text-[13px]">Made {period}</p>
            <p className="text-[17px] font-bold leading-snug text-heading">
              {totals.made.length
                ? totals.made.map((m, i) => (
                    <span key={m.unit} className="num">
                      {i > 0 ? <span className="font-medium text-muted"> + </span> : null}
                      {formatQty(m.qty)} <span className="text-sm font-semibold text-muted">{m.unit}</span>
                    </span>
                  ))
                : "None"}
            </p>
            <span className="sr-only">{madeText}</span>
          </div>
        </div>
      </div>

      <FilterBar
        search={{ name: "q", label: "Search", value: sp.q, placeholder: "Search run no. or product..." }}
        selects={[
          { name: "item", label: "Product", allLabel: "All products", value: sp.item, options: products.map((p) => ({ value: p.id, label: p.name })) },
          { name: "status", label: "Status", allLabel: "All runs", value: sp.status, options: [{ value: "over", label: "Used more than recipe" }, { value: "void", label: "Void" }] },
          { name: "from", label: "From", type: "date", value: sp.from },
          { name: "to", label: "To", type: "date", value: sp.to },
        ]}
      />

      <div className="card overflow-hidden">
        {list.rows.length === 0 ? (
          <EmptyState icon={Factory} title="No production runs found" action={newButton}>
            Nothing matches these filters. Clear them, or record the first run.
          </EmptyState>
        ) : (
          <>
            <ul className="divide-y divide-border xl:hidden">
              {list.rows.map((r) => (
                <li key={r.id} className={r.status === "void" ? "opacity-60" : ""}>
                  <Link href={`/admin/production/${r.id}`} className="flex flex-col gap-2 px-4 py-4 active:bg-background">
                    <span className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block font-semibold text-heading">{r.item_name}</span>
                        <span className="block text-xs text-muted">
                          {r.run_no} · {formatDate(r.run_date)} · {r.created_by_name || "Unknown"}
                        </span>
                      </span>
                      <span className="num shrink-0 text-right">
                        <span className="block text-base font-bold text-heading">{formatQty(r.qty_made)}</span>
                        <span className="block text-xs text-muted">{r.unit}</span>
                      </span>
                    </span>
                    <RunStatus status={r.status} overRecipe={r.over_recipe} />
                  </Link>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto xl:block">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Run</th>
                    <th scope="col">Date</th>
                    <th scope="col">Product</th>
                    <th scope="col" className="text-right">Made</th>
                    <th scope="col" className="text-right">Materials</th>
                    <th scope="col" className="hidden 2xl:table-cell">Entered by</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {list.rows.map((r) => (
                    <tr key={r.id} className={r.status === "void" ? "opacity-60" : ""}>
                      <td className="whitespace-nowrap">
                        <Link href={`/admin/production/${r.id}`} className="font-mono font-semibold text-heading hover:text-primary">{r.run_no}</Link>
                      </td>
                      <td className="whitespace-nowrap text-sm text-secondary">{formatDate(r.run_date)}</td>
                      <td className="min-w-[180px]">
                        <span className="font-medium text-text">{r.item_name}</span>
                        <div className="text-xs text-muted">
                          {r.category_name}
                          <span className="2xl:hidden"> · by {r.created_by_name || "Unknown"}</span>
                        </div>
                      </td>
                      <td className={`num text-right font-bold text-heading ${r.status === "void" ? "line-through" : ""}`}>
                        {formatQty(r.qty_made)} <span className="text-xs font-medium text-muted">{r.unit}</span>
                      </td>
                      <td className="num text-right text-sm text-secondary">{r.materials}</td>
                      <td className="hidden whitespace-nowrap text-sm text-secondary 2xl:table-cell">{r.created_by_name || "Unknown"}</td>
                      <td><RunStatus status={r.status} overRecipe={r.over_recipe} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} perPage={PAGE_SIZE} total={list.total} basePath="/admin/production" params={sp} />
          </>
        )}
      </div>
    </div>
  );
}
