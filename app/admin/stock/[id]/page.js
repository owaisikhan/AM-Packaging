import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, SlidersHorizontal, History } from "lucide-react";
import { requirePageRole } from "@/app/_lib/helpers";
import { getItem, getItemMovements, PAGE_SIZE } from "@/app/_lib/data-service";
import { formatMicron, formatMoney, formatQty } from "@/app/_lib/format-helpers";
import { formatDate, formatDateTime } from "@/app/_lib/date-helpers";
import PageHeader from "@/app/_components/layout/PageHeader";
import StockStatus from "@/app/_components/admin/StockStatus";
import MovementType from "@/app/_components/admin/MovementType";
import Pagination from "@/app/_components/ui/Pagination";
import EmptyState from "@/app/_components/ui/EmptyState";

export const metadata = { title: "Stock history" };

const REF_PATHS = { production_runs: "/admin/production", purchases: "/admin/purchases", sales: "/admin/sales" };

// The note on a stock entry, linked to the document behind it when there is one.
function MovementNote({ m }) {
  const base = REF_PATHS[m.ref_table];
  if (base && m.ref_id) {
    return (
      <Link href={`${base}/${m.ref_id}`} className="font-mono font-semibold text-primary hover:underline">
        {m.note || "Open"}
      </Link>
    );
  }
  return m.note || "None";
}

function Detail({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-right text-sm font-semibold text-heading">{children}</span>
    </div>
  );
}

export default async function StockItemPage({ params, searchParams }) {
  const user = await requirePageRole();
  const { id } = await params;
  const sp = await searchParams;
  const isAdmin = user.role === "admin";

  const item = await getItem(id);
  if (!item) notFound();
  const history = await getItemMovements(id, sp.page);
  const editHref = `${item.kind === "raw" ? "/admin/raw-materials" : "/admin/products"}/${item.id}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={item.name}
        subtitle={`${item.category_name} · ${item.kind === "raw" ? "Raw material" : "Product"}${item.code ? ` · ${item.code}` : ""}`}
        crumbs={[{ label: "Home", href: "/admin" }, { label: "Stock", href: "/admin/stock" }, { label: "History" }]}
        badge={<StockStatus status={item.stock_status} />}
        actions={
          <>
            <Link href="/admin/stock" className="btn-secondary">
              <ArrowLeft size={17} aria-hidden /> Back to Stock
            </Link>
            {isAdmin ? (
              <>
                <Link href={editHref} className="btn-secondary">
                  <Pencil size={16} aria-hidden /> Edit item
                </Link>
                <Link href={`/admin/stock/adjust?item=${item.id}`} className="btn-primary">
                  <SlidersHorizontal size={17} aria-hidden /> Adjust stock
                </Link>
              </>
            ) : null}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="card self-start p-5 sm:p-6">
          <p className="text-[13px] font-medium uppercase tracking-[0.04em] text-muted">In stock now</p>
          <p className="num mt-1 text-[34px] font-extrabold leading-tight text-heading">
            {formatQty(item.on_hand)} <span className="text-lg font-semibold text-muted">{item.unit}</span>
          </p>
          <div className="mt-4">
            <Detail label="Low-stock level">{`${formatQty(item.low_stock_level)} ${item.unit}`}</Detail>
            {item.brand_name ? <Detail label="Brand">{item.brand_name}</Detail> : null}
            {item.size_label ? <Detail label="Size">{item.size_label}</Detail> : null}
            {item.micron_value ? <Detail label="Micron">{formatMicron(item.micron_value)}</Detail> : null}
            {item.color_name ? <Detail label="Color / type">{item.color_name}</Detail> : null}
            {item.rolls_per_carton ? <Detail label="Rolls per carton">{item.rolls_per_carton}</Detail> : null}
            {isAdmin && Number(item.default_rate) > 0 ? <Detail label="Default rate"><span className="num">{formatMoney(item.default_rate, { decimals: true })}</span></Detail> : null}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary">
              <History size={18} aria-hidden />
            </span>
            <div>
              <h2 className="card-title">Stock history</h2>
              <p className="text-xs text-muted">Every entry that changed this item&apos;s stock, newest first</p>
            </div>
          </div>
          {history.rows.length === 0 ? (
            <EmptyState title="No stock entries yet">
              {isAdmin ? "Enter the opening stock to start this item's history." : "Nothing has been bought, made or sold yet."}
            </EmptyState>
          ) : (
            <>
              <ul className="divide-y divide-border md:hidden">
                {history.rows.map((m) => {
                  const qty = Number(m.qty);
                  return (
                    <li key={m.id} className="flex items-start justify-between gap-3 px-4 py-4">
                      <span className="min-w-0">
                        <MovementType type={m.type} />
                        <span className="mt-1.5 block text-sm text-secondary"><MovementNote m={m} /></span>
                        <span className="block text-xs text-muted">
                          {formatDate(m.movement_date)} · {m.actor_name}
                        </span>
                      </span>
                      <span className={`num shrink-0 text-base font-bold ${qty > 0 ? "text-primary" : "text-danger"}`}>
                        {qty > 0 ? "+" : "-"}
                        {formatQty(Math.abs(qty))} <span className="text-xs font-medium text-muted">{item.unit}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="hidden overflow-x-auto md:block">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">Type</th>
                      <th scope="col">Reference / reason</th>
                      <th scope="col" className="text-right">Change</th>
                      <th scope="col">By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.rows.map((m) => {
                      const qty = Number(m.qty);
                      return (
                        <tr key={m.id}>
                          <td className="whitespace-nowrap">
                            <div className="font-medium text-text">{formatDate(m.movement_date)}</div>
                            <div className="text-xs text-muted">{formatDateTime(m.created_at)}</div>
                          </td>
                          <td><MovementType type={m.type} /></td>
                          <td className="min-w-[180px] text-sm text-secondary"><MovementNote m={m} /></td>
                          <td className={`num text-right text-[15px] font-bold ${qty > 0 ? "text-primary" : "text-danger"}`}>
                            {qty > 0 ? "+" : "-"}
                            {formatQty(Math.abs(qty))} <span className="text-xs font-medium text-muted">{item.unit}</span>
                          </td>
                          <td className="whitespace-nowrap text-sm text-secondary">{m.actor_name}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination page={Math.max(1, Number(sp.page) || 1)} perPage={PAGE_SIZE} total={history.total} basePath={`/admin/stock/${item.id}`} params={sp} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
