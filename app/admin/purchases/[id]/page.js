import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Ban, Plus, Truck } from "lucide-react";
import { requirePageRole } from "@/app/_lib/helpers";
import { getPurchase } from "@/app/_lib/data-service";
import { formatMoney, formatQty } from "@/app/_lib/format-helpers";
import { formatDate, formatDateTime, todayISO } from "@/app/_lib/date-helpers";
import { voidPurchase } from "@/app/_lib/actions";
import PageHeader from "@/app/_components/layout/PageHeader";
import PaymentStatus from "@/app/_components/admin/PaymentStatus";
import MoneyRow from "@/app/_components/ui/MoneyRow";
import ReasonDialog from "@/app/_components/ui/ReasonDialog";
import PaymentForm from "@/app/_components/admin/PaymentForm";
import PaymentsTable from "@/app/_components/admin/PaymentsTable";

export const metadata = { title: "Purchase" };

const money = (n) => formatMoney(n, { decimals: Number(n) % 1 !== 0 });

export default async function PurchaseDetailPage({ params, searchParams }) {
  const user = await requirePageRole();
  const isAdmin = user.role === "admin";
  const { id } = await params;
  const { saved } = await searchParams;

  const data = await getPurchase(id, { withPayments: isAdmin });
  if (!data) notFound();
  const { purchase: p, lines, payments } = data;
  const isVoid = p.status === "void";
  const left = Math.max(Number(p.total) - Number(p.paid), 0);

  return (
    <div className="flex flex-col gap-6">
      {saved ? (
        <p role="status" className="rounded-xl bg-[#dcfce7] px-4 py-3 text-sm font-medium text-[#15803d] dark:bg-[#14532d] dark:text-[#4ade80]">
          Purchase {p.purchase_no} saved. The quantities have been added to stock.
        </p>
      ) : null}
      <PageHeader
        title={`Purchase ${p.purchase_no}`}
        subtitle={`${p.supplier_name} · ${formatDate(p.purchase_date)}${p.created_by_name ? ` · entered by ${p.created_by_name}` : ""}`}
        crumbs={[{ label: "Home", href: "/admin" }, { label: "Purchases", href: "/admin/purchases" }, { label: p.purchase_no }]}
        badge={<PaymentStatus status={isAdmin ? p.payment_status : isVoid ? "void" : "recorded"} />}
        actions={
          <>
            <Link href="/admin/purchases" className="btn-secondary">
              <ArrowLeft size={17} aria-hidden /> Back
            </Link>
            {!isVoid ? (
              <Link href={`/admin/purchases/new?supplier=${p.supplier_id}`} className="btn-secondary">
                <Plus size={17} aria-hidden /> Another from this supplier
              </Link>
            ) : null}
            {isAdmin && !isVoid ? (
              <ReasonDialog
                action={voidPurchase}
                id={p.id}
                triggerLabel="Void purchase"
                icon={<Ban size={16} aria-hidden />}
                title={`Void purchase ${p.purchase_no}?`}
                warning="The purchase stays in the records marked void. Its quantities are taken back out of stock, and any payments on it are voided too. This cannot be undone."
                confirmLabel="Void purchase"
              />
            ) : null}
          </>
        }
      />

      {isVoid ? (
        <p role="alert" className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c] dark:border-[#7f1d1d] dark:bg-[#450a0a] dark:text-[#f87171]">
          <span className="font-semibold">This purchase is void.</span> Reason: {p.void_reason}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="card p-5 sm:p-6">
            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">Supplier</p>
                <p className="mt-1 flex items-center gap-2 font-semibold text-heading">
                  <Truck size={16} className="text-muted" aria-hidden />
                  {isAdmin ? (
                    <Link href={`/admin/suppliers/${p.supplier_id}`} className="hover:text-primary">{p.supplier_name}</Link>
                  ) : (
                    p.supplier_name
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">Their bill no.</p>
                <p className="mt-1 font-semibold text-heading">{p.supplier_ref || "None"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">Entered</p>
                <p className="mt-1 text-sm text-secondary">{formatDateTime(p.created_at)}</p>
              </div>
            </div>
            {p.notes ? <p className="mt-5 rounded-xl bg-background px-4 py-3 text-sm text-secondary">{p.notes}</p> : null}
          </section>

          <section className="card overflow-hidden">
            <h2 className="card-title border-b border-border px-5 py-4">Items bought</h2>
            <ul className="divide-y divide-border md:hidden">
              {lines.map((l) => (
                <li key={l.id} className="flex items-start justify-between gap-3 px-5 py-4">
                  <span className="min-w-0">
                    <Link href={`/admin/stock/${l.item_id}`} className="block font-semibold text-heading hover:text-primary">{l.item_name}</Link>
                    <span className="num block text-xs text-muted">
                      {formatQty(l.qty)} {l.unit} x {money(l.rate)}
                    </span>
                  </span>
                  <span className="num shrink-0 font-bold text-heading">{money(l.amount)}</span>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto md:block">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Raw material</th>
                    <th scope="col" className="text-right">Quantity</th>
                    <th scope="col" className="text-right">Rate</th>
                    <th scope="col" className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={l.id}>
                      <td className="text-sm text-muted">{i + 1}</td>
                      <td>
                        <Link href={`/admin/stock/${l.item_id}`} className="font-semibold text-heading hover:text-primary">{l.item_name}</Link>
                        {l.brand_name ? <div className="text-xs text-muted">{l.brand_name}</div> : null}
                      </td>
                      <td className="num text-right">{formatQty(l.qty)} <span className="text-xs text-muted">{l.unit}</span></td>
                      <td className="num text-right text-secondary">{money(l.rate)}</td>
                      <td className="num text-right font-bold text-heading">{money(l.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="card p-5 sm:p-6">
            <h2 className="card-title border-b border-border pb-4">Bill total</h2>
            <div className="mt-4 flex flex-col gap-3">
              <MoneyRow label="Items subtotal">{money(p.subtotal)}</MoneyRow>
              {Number(p.discount) > 0 ? <MoneyRow label="Discount">-{money(p.discount)}</MoneyRow> : null}
              {Number(p.other_charges) > 0 ? <MoneyRow label="Freight / other">{money(p.other_charges)}</MoneyRow> : null}
              {Number(p.gst_amount) > 0 ? <MoneyRow label={`GST (${Number(p.gst_rate)}%)`}>{money(p.gst_amount)}</MoneyRow> : null}
              <div className="border-t border-border pt-3">
                <MoneyRow label="Grand total" strong tone="primary">{money(p.total)}</MoneyRow>
              </div>
              {isAdmin && !isVoid ? (
                <>
                  <MoneyRow label="Paid">{money(p.paid)}</MoneyRow>
                  <div className={`rounded-xl px-4 py-3 ${left > 0 ? "bg-[#fef2f2] dark:bg-[#450a0a]" : "bg-primary-light"}`}>
                    <MoneyRow label={left > 0 ? "Left to pay" : "Fully paid"} tone={left > 0 ? "danger" : "primary"}>
                      {money(left)}
                    </MoneyRow>
                  </div>
                </>
              ) : null}
            </div>
          </section>

          {isAdmin ? (
            <section className="card overflow-hidden">
              <h2 className="card-title border-b border-border px-5 py-4">Payments on this bill</h2>
              <PaymentsTable payments={payments} showBill={false} />
              {!isVoid && left > 0 ? (
                <div className="border-t border-border p-5">
                  <p className="mb-3 text-sm font-semibold text-heading">Record a payment</p>
                  <PaymentForm supplierId={p.supplier_id} purchaseId={p.id} today={todayISO()} suggested={left} />
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
