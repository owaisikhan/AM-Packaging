import Link from "next/link";
import { Plus, Receipt, Wallet, CircleCheck, CircleAlert } from "lucide-react";
import { requirePageRole } from "@/app/_lib/helpers";
import { getPurchasesPage, getPurchaseTotals, getSupplierOptions, PAGE_SIZE } from "@/app/_lib/data-service";
import { formatMoney } from "@/app/_lib/format-helpers";
import { todayISO } from "@/app/_lib/date-helpers";
import PageHeader from "@/app/_components/layout/PageHeader";
import StatCard from "@/app/_components/ui/StatCard";
import FilterBar from "@/app/_components/ui/FilterBar";
import PurchasesTable from "@/app/_components/admin/PurchasesTable";

export const metadata = { title: "Purchases" };

export default async function PurchasesPage({ searchParams }) {
  const user = await requirePageRole();
  const isAdmin = user.role === "admin";
  const sp = await searchParams;

  // Cards follow the date filter; with no dates they show this month.
  const today = todayISO();
  const monthStart = `${today.slice(0, 8)}01`;
  const cardFrom = sp.from || (sp.to ? undefined : monthStart);
  const cardTo = sp.to || (sp.from ? undefined : today);
  const period = sp.from || sp.to ? "in these dates" : "this month";

  const [suppliers, totals, list] = await Promise.all([
    getSupplierOptions(),
    getPurchaseTotals({ from: cardFrom, to: cardTo, supplier: sp.supplier }),
    getPurchasesPage({ supplier: sp.supplier, status: isAdmin ? sp.status : sp.status === "void" ? "void" : undefined, from: sp.from, to: sp.to, q: sp.q, page: sp.page }),
  ]);

  const statusOptions = isAdmin
    ? [
        { value: "unpaid", label: "Unpaid" },
        { value: "partly", label: "Partly paid" },
        { value: "paid", label: "Paid" },
        { value: "void", label: "Void" },
      ]
    : [{ value: "void", label: "Void" }];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Purchases"
        subtitle="Raw material bought from suppliers. Saving a purchase adds its quantities to stock."
        crumbs={[{ label: "Home", href: "/admin" }, { label: "Purchases" }]}
        actions={
          <Link href="/admin/purchases/new" className="btn-primary">
            <Plus size={18} aria-hidden /> New Purchase
          </Link>
        }
      />

      <div className={`grid grid-cols-2 gap-3 sm:gap-4 ${isAdmin ? "xl:grid-cols-4" : ""}`}>
        <StatCard icon={Receipt} label={`Bills ${period}`} value={totals.bills} tone="info" valueTone="plain" />
        <StatCard icon={Wallet} label={`Spent ${period}`} value={formatMoney(totals.total)} tone="primary" valueTone="plain" />
        {isAdmin ? (
          <>
            <StatCard icon={CircleCheck} label="Paid on these bills" value={formatMoney(totals.paid)} tone="primary" />
            <StatCard icon={CircleAlert} label="Still to pay" value={formatMoney(totals.unpaid)} tone="danger" />
          </>
        ) : null}
      </div>

      <FilterBar
        search={{ name: "q", label: "Search", value: sp.q, placeholder: "Search purchase no., their bill no. or supplier..." }}
        selects={[
          { name: "supplier", label: "Supplier", allLabel: "All suppliers", value: sp.supplier, options: suppliers.map((s) => ({ value: s.id, label: s.name })) },
          { name: "status", label: "Status", allLabel: "All statuses", value: sp.status, options: statusOptions },
          { name: "from", label: "From", type: "date", value: sp.from },
          { name: "to", label: "To", type: "date", value: sp.to },
        ]}
      />

      <PurchasesTable
        rows={list.rows}
        total={list.total}
        page={Math.max(1, Number(sp.page) || 1)}
        perPage={PAGE_SIZE}
        params={sp}
        isAdmin={isAdmin}
        emptyAction={
          <Link href="/admin/purchases/new" className="btn-primary">
            <Plus size={18} aria-hidden /> New Purchase
          </Link>
        }
      />
    </div>
  );
}
