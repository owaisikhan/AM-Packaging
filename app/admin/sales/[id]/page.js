import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Ban, Package2, Plus } from "lucide-react";
import { requirePageRole } from "@/app/_lib/helpers";
import { getSale, getSettings } from "@/app/_lib/data-service";
import { amountInWords, formatMoney, formatQty } from "@/app/_lib/format-helpers";
import { formatDate, todayISO } from "@/app/_lib/date-helpers";
import { voidSale } from "@/app/_lib/actions";
import PageHeader from "@/app/_components/layout/PageHeader";
import ReasonDialog from "@/app/_components/ui/ReasonDialog";
import PrintButton from "@/app/_components/ui/PrintButton";
import PaymentStatus from "@/app/_components/admin/PaymentStatus";
import { OverduePill } from "@/app/_components/admin/SalesTable";
import PaymentForm from "@/app/_components/admin/PaymentForm";
import PaymentsTable from "@/app/_components/admin/PaymentsTable";

export const metadata = { title: "Invoice" };

const money = (n) => formatMoney(n, { decimals: Number(n) % 1 !== 0 });

function MetaRow({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-1">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-right text-sm font-semibold text-heading">{children}</span>
    </div>
  );
}

function TotalRow({ label, children, strong }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "border-t border-border pt-3" : ""}`}>
      <span className={strong ? "text-lg font-bold text-heading" : "text-sm text-muted"}>{label}</span>
      <span className={`num text-right ${strong ? "text-xl font-extrabold text-primary-ink" : "text-sm font-semibold text-heading"}`}>{children}</span>
    </div>
  );
}

export default async function InvoicePage({ params, searchParams }) {
  const user = await requirePageRole();
  const isAdmin = user.role === "admin";
  const { id } = await params;
  const { saved } = await searchParams;

  const [data, settings] = await Promise.all([getSale(id, { withPayments: isAdmin }), getSettings()]);
  if (!data) notFound();
  const { sale: s, customer: c, lines, payments } = data;
  const isVoid = s.status === "void";
  const left = Math.max(Number(s.total) - Number(s.paid), 0);
  const co = settings ?? {};

  return (
    <div className="flex flex-col gap-6">
      {saved ? (
        <p role="status" className="no-print rounded-xl bg-[#dcfce7] px-4 py-3 text-sm font-medium text-[#15803d] dark:bg-[#14532d] dark:text-[#4ade80]">
          Invoice {s.invoice_no} saved. The products have been taken out of stock.
        </p>
      ) : null}
      <div className="no-print">
        <PageHeader
          title={`Invoice ${s.invoice_no}`}
          subtitle={`${s.customer_name} · ${formatDate(s.sale_date)}${s.created_by_name ? ` · made by ${s.created_by_name}` : ""}`}
          crumbs={[{ label: "Home", href: "/admin" }, { label: "Sales & Invoices", href: "/admin/sales" }, { label: s.invoice_no }]}
          badge={
            <span className="inline-flex flex-wrap gap-1.5">
              <PaymentStatus status={isAdmin ? s.payment_status : isVoid ? "void" : "recorded"} />
              {isAdmin && s.overdue ? <OverduePill due={s.due_date} /> : null}
            </span>
          }
          actions={
            <>
              <Link href="/admin/sales" className="btn-secondary">
                <ArrowLeft size={17} aria-hidden /> Back
              </Link>
              <PrintButton />
              {!isVoid ? (
                <Link href={`/admin/sales/new?customer=${s.customer_id}`} className="btn-secondary">
                  <Plus size={17} aria-hidden /> Another for this customer
                </Link>
              ) : null}
              {isAdmin && !isVoid ? (
                <ReasonDialog
                  action={voidSale}
                  id={s.id}
                  triggerLabel="Void invoice"
                  icon={<Ban size={16} aria-hidden />}
                  title={`Void invoice ${s.invoice_no}?`}
                  warning="The invoice stays in the records marked void. Its products go back into stock and any payments on it are voided too. This cannot be undone."
                  confirmLabel="Void invoice"
                />
              ) : null}
            </>
          }
        />
      </div>

      {/* The invoice sheet: this is all that prints */}
      <article className="invoice-sheet card relative mx-auto w-full max-w-[900px] overflow-hidden p-6 sm:p-10">
        {isVoid ? (
          <div className="pointer-events-none absolute right-8 top-10 rotate-[-12deg] rounded-lg border-4 border-danger px-4 py-1 text-3xl font-black tracking-widest text-danger-ink opacity-80" aria-hidden>
            VOID
          </div>
        ) : null}

        <header className="flex flex-col gap-6 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            {co.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={co.logo_url} alt={`${co.company_name} logo`} className="h-14 w-14 rounded-xl object-contain" />
            ) : (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                <Package2 size={28} aria-hidden />
              </span>
            )}
            <div>
              <p className="text-xl font-extrabold leading-tight text-heading">{co.company_name}</p>
              {co.tagline ? <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-primary-ink">{co.tagline}</p> : null}
              <p className="mt-2 max-w-xs text-sm text-secondary">{co.address}</p>
              <p className="text-sm text-secondary">
                {[co.phone, co.email].filter(Boolean).join(" · ")}
              </p>
              {co.ntn || co.strn ? (
                <p className="text-xs text-muted">{[co.ntn && `NTN ${co.ntn}`, co.strn && `STRN ${co.strn}`].filter(Boolean).join(" · ")}</p>
              ) : null}
            </div>
          </div>
          <div className="sm:text-right">
            <p className="text-3xl font-extrabold tracking-tight text-heading">INVOICE</p>
            <p className="font-mono text-lg font-bold text-primary-ink">{s.invoice_no}</p>
          </div>
        </header>

        <section className="grid gap-6 border-b border-border py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted">Billed to</p>
            <p className="mt-2 text-lg font-bold text-heading">{c?.name}</p>
            {c?.contact_person ? <p className="text-sm text-secondary">{c.contact_person}</p> : null}
            {c?.address ? <p className="text-sm text-secondary">{c.address}</p> : null}
            {c?.phone ? <p className="text-sm text-secondary">{c.phone}</p> : null}
            {c?.ntn ? <p className="text-xs text-muted">NTN {c.ntn}</p> : null}
          </div>
          <div className="rounded-xl bg-background px-5 py-4">
            <MetaRow label="Invoice no.">{s.invoice_no}</MetaRow>
            <MetaRow label="Invoice date">{formatDate(s.sale_date)}</MetaRow>
            <MetaRow label="Payment due">{s.due_date ? formatDate(s.due_date) : "On receipt"}</MetaRow>
            {isVoid ? <MetaRow label="Status"><span className="text-danger-ink">Void</span></MetaRow> : null}
          </div>
        </section>

        <section className="py-6">
          <table className="data-table invoice-lines">
            <thead>
              <tr>
                <th scope="col" className="w-10">#</th>
                <th scope="col">Item</th>
                <th scope="col" className="hidden text-right sm:table-cell">Qty</th>
                <th scope="col" className="hidden text-right sm:table-cell">Rate</th>
                <th scope="col" className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={l.id}>
                  <td className="text-sm text-muted">{i + 1}</td>
                  <td>
                    <span className="font-semibold text-heading">{l.item_name}</span>
                    {l.item_code ? <span className="block font-mono text-xs text-muted">{l.item_code}</span> : null}
                    <span className="num mt-0.5 block text-xs text-secondary sm:hidden">
                      {formatQty(l.qty)} {l.unit} x {money(l.rate)}
                    </span>
                  </td>
                  <td className="num hidden text-right sm:table-cell">{formatQty(l.qty)} <span className="text-xs text-muted">{l.unit}</span></td>
                  <td className="num hidden text-right text-secondary sm:table-cell">{money(l.rate)}</td>
                  <td className="num text-right font-bold text-heading">{money(l.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="grid gap-6 sm:grid-cols-[1fr_320px]">
          <div className="text-sm">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted">Amount in words</p>
            <p className="mt-1 font-semibold text-heading">{amountInWords(s.total)}</p>
            {s.notes ? <p className="mt-4 text-secondary">{s.notes}</p> : null}
          </div>
          <div className="flex flex-col gap-2.5">
            <TotalRow label="Subtotal">{money(s.subtotal)}</TotalRow>
            {Number(s.discount) > 0 ? <TotalRow label="Discount">-{money(s.discount)}</TotalRow> : null}
            {Number(s.other_charges) > 0 ? <TotalRow label="Freight / other">{money(s.other_charges)}</TotalRow> : null}
            {Number(s.gst_amount) > 0 ? <TotalRow label={`GST (${Number(s.gst_rate)}%)`}>{money(s.gst_amount)}</TotalRow> : null}
            <TotalRow label="Grand total" strong>{money(s.total)}</TotalRow>
            {isAdmin && !isVoid ? (
              <>
                <div className="flex justify-between gap-4 rounded-lg bg-primary-light px-3 py-2 text-sm font-semibold text-primary-ink">
                  <span>Amount received</span>
                  <span className="num">{money(s.paid)}</span>
                </div>
                <div className="flex justify-between gap-4 px-3 text-sm font-semibold">
                  <span className="text-muted">Balance due</span>
                  <span className={`num ${left > 0 ? "text-danger-ink" : "text-primary-ink"}`}>{money(left)}</span>
                </div>
              </>
            ) : null}
          </div>
        </section>

        <footer className="mt-8 grid gap-6 border-t border-border pt-6 sm:grid-cols-[1fr_220px] sm:items-end">
          <div className="text-xs text-secondary">
            {co.invoice_terms ? (
              <>
                <p className="font-bold uppercase tracking-[0.08em] text-muted">Payment terms</p>
                <p className="mt-1 whitespace-pre-line">{co.invoice_terms}</p>
              </>
            ) : null}
            {co.invoice_footer ? <p className="mt-3 font-medium text-heading">{co.invoice_footer}</p> : null}
            {isVoid ? <p className="mt-3 font-semibold text-danger-ink">Void: {s.void_reason}</p> : null}
          </div>
          <div className="text-center">
            <div className="h-12 border-b border-heading" aria-hidden />
            <p className="mt-1.5 text-xs text-muted">Authorised signature</p>
          </div>
        </footer>
      </article>

      {isAdmin ? (
        <section className="no-print card mx-auto w-full max-w-[900px] overflow-hidden">
          <h2 className="card-title border-b border-border px-5 py-4">Payments on this invoice</h2>
          <PaymentsTable kind="customer" payments={payments} showBill={false} />
          {!isVoid && left > 0 ? (
            <div className="border-t border-border p-5">
              <p className="mb-3 text-sm font-semibold text-heading">Record a payment received</p>
              <PaymentForm kind="customer" partyId={s.customer_id} docId={s.id} today={todayISO()} suggested={left} />
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
