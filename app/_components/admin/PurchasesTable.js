import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { formatMoney } from "@/app/_lib/format-helpers";
import { formatDate } from "@/app/_lib/date-helpers";
import PaymentStatus from "./PaymentStatus";
import EmptyState from "@/app/_components/ui/EmptyState";
import Pagination from "@/app/_components/ui/Pagination";

export default function PurchasesTable({ rows, total, page, perPage, params, isAdmin, emptyAction }) {
  if (rows.length === 0) {
    return (
      <div className="card overflow-hidden">
        <EmptyState icon={ShoppingCart} title="No purchases found" action={emptyAction}>
          Nothing matches these filters. Clear them, or record the first purchase.
        </EmptyState>
      </div>
    );
  }
  const statusOf = (r) => (isAdmin ? r.payment_status : r.status === "void" ? "void" : "recorded");

  return (
    <div className="card overflow-hidden">
      <ul className="divide-y divide-border xl:hidden">
        {rows.map((r) => (
          <li key={r.id} className={r.status === "void" ? "opacity-60" : ""}>
            <Link href={`/admin/purchases/${r.id}`} className="flex flex-col gap-2 px-4 py-4 active:bg-background">
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block font-semibold text-heading">{r.supplier_name}</span>
                  <span className="block text-xs text-muted">
                    {r.purchase_no} · {formatDate(r.purchase_date)}
                  </span>
                </span>
                <span className="num shrink-0 text-base font-bold text-heading">{formatMoney(r.total)}</span>
              </span>
              <span className="flex flex-wrap items-center gap-2">
                <PaymentStatus status={statusOf(r)} />
                {isAdmin && r.status !== "void" && r.paid > 0 && r.paid < r.total ? (
                  <span className="num text-xs text-muted">Paid {formatMoney(r.paid)}</span>
                ) : null}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto xl:block">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Purchase</th>
              <th scope="col">Date</th>
              <th scope="col">Supplier</th>
              <th scope="col" className="text-right">Items</th>
              <th scope="col" className="text-right">Total</th>
              {isAdmin ? <th scope="col" className="text-right">Paid</th> : null}
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={r.status === "void" ? "opacity-60" : ""}>
                <td className="whitespace-nowrap">
                  <Link href={`/admin/purchases/${r.id}`} className="font-mono font-semibold text-heading hover:text-primary">
                    {r.purchase_no}
                  </Link>
                  {r.supplier_ref ? <div className="text-xs text-muted">Their bill {r.supplier_ref}</div> : null}
                </td>
                <td className="whitespace-nowrap text-sm text-secondary">{formatDate(r.purchase_date)}</td>
                <td className="min-w-[180px] font-medium text-text">{r.supplier_name}</td>
                <td className="num text-right text-sm text-secondary">{r.line_count}</td>
                <td className={`num text-right font-bold text-heading ${r.status === "void" ? "line-through" : ""}`}>{formatMoney(r.total)}</td>
                {isAdmin ? <td className="num text-right text-sm text-secondary">{r.status === "void" ? "None" : formatMoney(r.paid)}</td> : null}
                <td>
                  <PaymentStatus status={statusOf(r)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} perPage={perPage} total={total} basePath="/admin/purchases" params={params} />
    </div>
  );
}
