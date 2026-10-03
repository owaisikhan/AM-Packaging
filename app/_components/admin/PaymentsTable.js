import Link from "next/link";
import { Ban } from "lucide-react";
import { voidCustomerPayment, voidSupplierPayment } from "@/app/_lib/actions";
import { formatMoney } from "@/app/_lib/format-helpers";
import { formatDate } from "@/app/_lib/date-helpers";
import ReasonDialog from "@/app/_components/ui/ReasonDialog";
import Badge from "@/app/_components/ui/Badge";

const METHOD = { cash: "Cash", bank: "Bank transfer", cheque: "Cheque", online: "Online / IBFT", other: "Other" };

// Payments to a supplier or from a customer, void ones kept in view with
// their reason.
export default function PaymentsTable({ payments, showBill = true, kind = "supplier" }) {
  const isCustomer = kind === "customer";
  if (payments.length === 0) {
    return <p className="px-5 py-8 text-center text-sm text-muted">No payments yet.</p>;
  }
  return (
    <ul className="divide-y divide-border">
      {payments.map((p) => {
        const isVoid = p.status === "void";
        return (
          <li key={p.id} className={`flex flex-wrap items-start justify-between gap-3 px-5 py-4 ${isVoid ? "opacity-70" : ""}`}>
            <div className="min-w-0">
              <p className={`num text-base font-bold ${isVoid ? "text-muted line-through" : "text-heading"}`}>
                {formatMoney(p.amount, { decimals: Number(p.amount) % 1 !== 0 })}
              </p>
              <p className="text-sm text-secondary">
                {formatDate(p.payment_date)} · {METHOD[p.method] ?? p.method}
                {p.reference ? ` · ${p.reference}` : ""}
              </p>
              {showBill && (isCustomer ? p.invoice_no : p.purchase_no) ? (
                <p className="text-xs text-muted">
                  Against{" "}
                  <Link
                    href={isCustomer ? `/admin/sales/${p.sale_id}` : `/admin/purchases/${p.purchase_id}`}
                    className="font-mono font-semibold text-primary-ink hover:underline"
                  >
                    {isCustomer ? p.invoice_no : p.purchase_no}
                  </Link>
                </p>
              ) : null}
              {p.note ? <p className="text-xs text-muted">{p.note}</p> : null}
              {isVoid ? <p className="mt-1 text-xs font-medium text-danger-ink">Void: {p.void_reason}</p> : null}
            </div>
            {isVoid ? (
              <Badge tone="gray">
                <Ban size={13} aria-hidden /> Void
              </Badge>
            ) : (
              <ReasonDialog
                action={isCustomer ? voidCustomerPayment : voidSupplierPayment}
                id={p.id}
                triggerLabel="Void"
                icon={<Ban size={16} aria-hidden />}
                triggerClassName="btn-secondary min-h-[38px] px-3 py-1.5 text-[13px]"
                title="Void this payment?"
                warning={`The ${formatMoney(p.amount)} payment stays in the history marked void, and the ${isCustomer ? "customer" : "supplier"}'s balance goes back up by that amount.`}
                confirmLabel="Void payment"
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
