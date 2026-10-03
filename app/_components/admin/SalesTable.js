import Link from "next/link";
import { Receipt, CalendarX } from "lucide-react";
import { formatMoney } from "@/app/_lib/format-helpers";
import { formatDate, todayISO } from "@/app/_lib/date-helpers";
import PaymentStatus from "./PaymentStatus";
import EmptyState from "@/app/_components/ui/EmptyState";
import Pagination from "@/app/_components/ui/Pagination";
import Badge from "@/app/_components/ui/Badge";

function daysLate(due) {
  const ms = new Date(`${todayISO()}T00:00:00Z`) - new Date(`${due}T00:00:00Z`);
  return Math.max(1, Math.round(ms / 86400000));
}

export function OverduePill({ due }) {
  const d = daysLate(due);
  return (
    <Badge tone="danger">
      <CalendarX size={13} strokeWidth={2.2} aria-hidden /> Overdue {d} {d === 1 ? "day" : "days"}
    </Badge>
  );
}

export default function SalesTable({ rows, total, page, perPage, params, isAdmin, emptyAction }) {
  if (rows.length === 0) {
    return (
      <div className="card overflow-hidden">
        <EmptyState icon={Receipt} title="No invoices found" action={emptyAction}>
          Nothing matches these filters. Clear them, or make the first invoice.
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
            <Link href={`/admin/sales/${r.id}`} className="flex flex-col gap-2 px-4 py-4 active:bg-background">
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block font-semibold text-heading">{r.customer_name}</span>
                  <span className="block text-xs text-muted">
                    {r.invoice_no} · {formatDate(r.sale_date)}
                  </span>
                </span>
                <span className="num shrink-0 text-base font-bold text-heading">{formatMoney(r.total)}</span>
              </span>
              <span className="flex flex-wrap items-center gap-2">
                <PaymentStatus status={statusOf(r)} />
                {isAdmin && r.overdue ? <OverduePill due={r.due_date} /> : null}
                {isAdmin && r.status !== "void" && r.paid > 0 && r.paid < r.total ? (
                  <span className="num text-xs text-muted">Received {formatMoney(r.paid)}</span>
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
              <th scope="col">Invoice</th>
              <th scope="col">Date</th>
              <th scope="col">Customer</th>
              <th scope="col" className="text-right">Items</th>
              <th scope="col" className="text-right">Total</th>
              {isAdmin ? <th scope="col" className="text-right">Received</th> : null}
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={r.status === "void" ? "opacity-60" : ""}>
                <td className="whitespace-nowrap">
                  <Link href={`/admin/sales/${r.id}`} className="font-mono font-semibold text-heading hover:text-primary-ink">
                    {r.invoice_no}
                  </Link>
                  {r.due_date ? <div className="text-xs text-muted">Due {formatDate(r.due_date)}</div> : null}
                </td>
                <td className="whitespace-nowrap text-sm text-secondary">{formatDate(r.sale_date)}</td>
                <td className="min-w-[180px] font-medium text-text">{r.customer_name}</td>
                <td className="num text-right text-sm text-secondary">{r.line_count}</td>
                <td className={`num text-right font-bold text-heading ${r.status === "void" ? "line-through" : ""}`}>{formatMoney(r.total)}</td>
                {isAdmin ? <td className="num text-right text-sm text-secondary">{r.status === "void" ? "None" : formatMoney(r.paid)}</td> : null}
                <td>
                  <span className="inline-flex flex-wrap gap-1.5">
                    <PaymentStatus status={statusOf(r)} />
                    {isAdmin && r.overdue ? <OverduePill due={r.due_date} /> : null}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} perPage={perPage} total={total} basePath="/admin/sales" params={params} />
    </div>
  );
}
