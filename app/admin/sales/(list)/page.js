import Link from "next/link";
import { Plus, Receipt, Wallet, CircleCheck, CircleAlert } from "lucide-react";
import { requirePagePermission, can } from "@/app/_lib/helpers";
import { getCustomerOptions, getSalesPage, getSaleTotals, PAGE_SIZE } from "@/app/_lib/data-service";
import { formatMoney } from "@/app/_lib/format-helpers";
import { todayISO } from "@/app/_lib/date-helpers";
import PageHeader from "@/app/_components/layout/PageHeader";
import StatCard from "@/app/_components/ui/StatCard";
import FilterBar from "@/app/_components/ui/FilterBar";
import SalesTable from "@/app/_components/admin/SalesTable";

export const metadata = { title: "Sales & Invoices" };

export default async function SalesPage({ searchParams }) {
  const user = await requirePagePermission("sales");
  // Payment status, paid amounts and money cards need "See balances and payments".
  const isAdmin = can(user, "balances");
  const sp = await searchParams;

  const today = todayISO();
  const monthStart = `${today.slice(0, 8)}01`;
  const cardFrom = sp.from || (sp.to ? undefined : monthStart);
  const cardTo = sp.to || (sp.from ? undefined : today);
  const period = sp.from || sp.to ? "in these dates" : "this month";
  const status = isAdmin ? sp.status : sp.status === "void" ? "void" : undefined;

  const [customers, totals, list] = await Promise.all([
    getCustomerOptions(),
    getSaleTotals({ from: cardFrom, to: cardTo, customer: sp.customer }),
    getSalesPage({ customer: sp.customer, status, from: sp.from, to: sp.to, q: sp.q, page: sp.page }),
  ]);

  const statusOptions = isAdmin
    ? [
        { value: "unpaid", label: "Unpaid" },
        { value: "partly", label: "Partly paid" },
        { value: "paid", label: "Paid" },
        { value: "overdue", label: "Overdue" },
        { value: "void", label: "Void" },
      ]
    : [{ value: "void", label: "Void" }];
  const newButton = (
    <Link href="/admin/sales/new" className="btn-primary">
      <Plus size={18} aria-hidden /> New Invoice
    </Link>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sales & Invoices"
        subtitle="Invoices to customers. Saving an invoice takes its products out of stock."
        crumbs={[{ label: "Home", href: "/admin" }, { label: "Sales & Invoices" }]}
        actions={newButton}
      />

      <div className={`grid grid-cols-2 gap-3 sm:gap-4 ${isAdmin ? "2xl:grid-cols-4" : ""}`}>
        <StatCard icon={Receipt} label={`Invoices ${period}`} value={totals.invoices} tone="info" valueTone="plain" />
        <StatCard icon={Wallet} label={`Sales ${period}`} value={formatMoney(totals.total)} tone="primary" valueTone="plain" />
        {isAdmin ? (
          <>
            <StatCard icon={CircleCheck} label="Received on these" value={formatMoney(totals.paid)} tone="primary" />
            <StatCard icon={CircleAlert} label="Still to receive" value={formatMoney(totals.unpaid)} tone="danger" />
          </>
        ) : null}
      </div>

      <FilterBar
        search={{ name: "q", label: "Search", value: sp.q, placeholder: "Search invoice no. or customer..." }}
        selects={[
          { name: "customer", label: "Customer", allLabel: "All customers", value: sp.customer, options: customers.map((c) => ({ value: c.id, label: c.name })) },
          { name: "status", label: "Status", allLabel: "All statuses", value: sp.status, options: statusOptions },
          { name: "from", label: "From", type: "date", value: sp.from },
          { name: "to", label: "To", type: "date", value: sp.to },
        ]}
      />

      <SalesTable
        rows={list.rows}
        total={list.total}
        page={Math.max(1, Number(sp.page) || 1)}
        perPage={PAGE_SIZE}
        params={sp}
        isAdmin={isAdmin}
        emptyAction={newButton}
      />
    </div>
  );
}
