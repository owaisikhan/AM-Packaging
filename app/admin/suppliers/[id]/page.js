import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Plus, Phone, MapPin, BookOpen } from "lucide-react";
import { requirePageRole, ROLES } from "@/app/_lib/helpers";
import { getOpenPurchases, getSupplier, getSupplierBalance, getSupplierLedger, getSupplierPayments } from "@/app/_lib/data-service";
import { formatMoney } from "@/app/_lib/format-helpers";
import { formatDate, todayISO } from "@/app/_lib/date-helpers";
import PageHeader from "@/app/_components/layout/PageHeader";
import FilterBar from "@/app/_components/ui/FilterBar";
import MoneyRow from "@/app/_components/ui/MoneyRow";
import PaymentForm from "@/app/_components/admin/PaymentForm";
import PaymentsTable from "@/app/_components/admin/PaymentsTable";

export const metadata = { title: "Supplier ledger" };

const money = (n) => formatMoney(n, { decimals: Number(n) % 1 !== 0 });

function BalanceText({ value }) {
  const n = Number(value);
  if (n > 0) return <span className="text-danger-ink">{money(n)} <span className="text-xs font-semibold">to pay</span></span>;
  if (n < 0) return <span className="text-primary-ink">{money(-n)} <span className="text-xs font-semibold">advance</span></span>;
  return <span className="text-muted">Settled</span>;
}

export default async function SupplierLedgerPage({ params, searchParams }) {
  await requirePageRole(ROLES.ADMIN);
  const { id } = await params;
  const sp = await searchParams;

  const supplier = await getSupplier(id);
  if (!supplier) notFound();
  const [balance, ledger, payments, openBills] = await Promise.all([
    getSupplierBalance(id),
    getSupplierLedger(id, { from: sp.from, to: sp.to }),
    getSupplierPayments(id),
    getOpenPurchases(id),
  ]);
  const closing = ledger.length ? ledger[ledger.length - 1].balance : 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={supplier.name}
        subtitle="Supplier ledger: every purchase and payment, with the running balance."
        crumbs={[{ label: "Home", href: "/admin" }, { label: "Suppliers", href: "/admin/suppliers" }, { label: supplier.name }]}
        actions={
          <>
            <Link href="/admin/suppliers" className="btn-secondary">
              <ArrowLeft size={17} aria-hidden /> Back
            </Link>
            <Link href={`/admin/suppliers/${id}/edit`} className="btn-secondary">
              <Pencil size={15} aria-hidden /> Edit
            </Link>
            <Link href={`/admin/purchases/new?supplier=${id}`} className="btn-primary">
              <Plus size={18} aria-hidden /> New Purchase
            </Link>
          </>
        }
      />

      <div className="grid gap-6 2xl:grid-cols-[1fr_380px]">
        <div className="flex min-w-0 flex-col gap-6">
          <FilterBar
            selects={[
              { name: "from", label: "From", type: "date", value: sp.from },
              { name: "to", label: "To", type: "date", value: sp.to },
            ]}
          />

          <section className="card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary-ink">
                <BookOpen size={18} aria-hidden />
              </span>
              <div>
                <h2 className="card-title">Ledger</h2>
                <p className="text-xs text-muted">
                  {sp.from || sp.to
                    ? `${sp.from ? formatDate(sp.from) : "Start"} to ${sp.to ? formatDate(sp.to) : "today"}`
                    : "All entries, oldest first"}
                  . Void bills and payments are left out.
                </p>
              </div>
            </div>

            <ul className="divide-y divide-border xl:hidden">
              {ledger.map((e, i) => (
                <li key={`${e.kind}-${e.entry_id ?? i}`} className="flex items-start justify-between gap-3 px-4 py-4">
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-heading">{e.description}</span>
                    <span className="block text-xs text-muted">
                      {e.entry_date ? formatDate(e.entry_date) : "Before"}
                      {e.ref ? ` · ${e.ref}` : ""}
                    </span>
                    <span className={`num block text-sm font-semibold ${Number(e.credit) > 0 ? "text-primary-ink" : "text-heading"}`}>
                      {Number(e.credit) > 0 ? `-${money(e.credit)}` : Number(e.debit) > 0 ? `+${money(e.debit)}` : money(0)}
                    </span>
                  </span>
                  <span className="num shrink-0 text-right text-sm font-bold"><BalanceText value={e.balance} /></span>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto xl:block">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Entry</th>
                    <th scope="col" className="text-right">Purchase (+)</th>
                    <th scope="col" className="text-right">Payment (-)</th>
                    <th scope="col" className="text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((e, i) => (
                    <tr key={`${e.kind}-${e.entry_id ?? i}`} className={e.kind === "opening" ? "bg-background" : ""}>
                      <td className="whitespace-nowrap text-sm text-secondary">{e.entry_date ? formatDate(e.entry_date) : "None"}</td>
                      <td className="min-w-[200px]">
                        <span className="block text-sm font-medium text-text">{e.description}</span>
                        {e.purchase_id && e.ref ? (
                          <Link href={`/admin/purchases/${e.purchase_id}`} className="tap-inline font-mono text-xs font-semibold text-primary-ink hover:underline">{e.ref}</Link>
                        ) : null}
                      </td>
                      <td className="num text-right text-sm text-heading">{Number(e.debit) > 0 ? money(e.debit) : ""}</td>
                      <td className="num text-right text-sm text-primary-ink">{Number(e.credit) > 0 ? money(e.credit) : ""}</td>
                      <td className="num text-right font-bold"><BalanceText value={e.balance} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border bg-background px-5 py-4">
              <span className="text-sm font-semibold text-heading">{sp.to ? `Balance on ${formatDate(sp.to)}` : "Balance now"}</span>
              <span className="num text-lg font-extrabold"><BalanceText value={closing} /></span>
            </div>
          </section>

          <section className="card overflow-hidden">
            <h2 className="card-title border-b border-border px-5 py-4">Payments made</h2>
            <PaymentsTable payments={payments} />
          </section>
        </div>

        <div className="grid content-start gap-6 lg:grid-cols-2 2xl:grid-cols-1">
          <section className="card self-start p-5 sm:p-6">
            <div className="flex flex-col gap-2 border-b border-border pb-4 text-sm text-secondary">
              {supplier.contact_person ? <p className="font-semibold text-heading">{supplier.contact_person}</p> : null}
              {supplier.phone ? (
                <a href={`tel:${supplier.phone.replace(/\s/g, "")}`} className="tap-inline flex items-center gap-2 hover:text-primary-ink">
                  <Phone size={15} aria-hidden /> {supplier.phone}
                </a>
              ) : null}
              {supplier.address ? (
                <p className="flex items-start gap-2">
                  <MapPin size={15} className="mt-0.5 shrink-0" aria-hidden /> {supplier.address}
                </p>
              ) : null}
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <MoneyRow label="Opening balance">{money(balance?.opening_balance ?? 0)}</MoneyRow>
              <MoneyRow label="All purchases">{money(balance?.billed ?? 0)}</MoneyRow>
              <MoneyRow label="All payments">{money(balance?.paid ?? 0)}</MoneyRow>
              <div className={`rounded-xl px-4 py-3 ${Number(balance?.balance) > 0 ? "bg-[#fef2f2] dark:bg-[#450a0a]" : "bg-primary-light"}`}>
                <MoneyRow label="You owe them" strong tone={Number(balance?.balance) > 0 ? "danger" : "primary"}>
                  {money(Math.max(Number(balance?.balance ?? 0), 0))}
                </MoneyRow>
              </div>
            </div>
          </section>

          <section className="card self-start p-5 sm:p-6">
            <h2 className="card-title border-b border-border pb-4">Record a payment</h2>
            <div className="mt-4">
              <PaymentForm supplierId={id} openBills={openBills} today={todayISO()} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
