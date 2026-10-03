import Link from "next/link";
import { Plus, Truck, Wallet, CircleAlert } from "lucide-react";
import { requirePageRole } from "@/app/_lib/helpers";
import { getSuppliersPage, getSupplierTotals, PAGE_SIZE } from "@/app/_lib/data-service";
import { formatMoney } from "@/app/_lib/format-helpers";
import { formatDate } from "@/app/_lib/date-helpers";
import PageHeader from "@/app/_components/layout/PageHeader";
import StatCard from "@/app/_components/ui/StatCard";
import FilterBar from "@/app/_components/ui/FilterBar";
import Pagination from "@/app/_components/ui/Pagination";
import EmptyState from "@/app/_components/ui/EmptyState";
import Badge from "@/app/_components/ui/Badge";

export const metadata = { title: "Suppliers" };

function Balance({ value }) {
  const n = Number(value);
  if (n > 0) return <span className="num font-bold text-danger">{formatMoney(n)} <span className="text-xs font-medium">to pay</span></span>;
  if (n < 0) return <span className="num font-bold text-primary">{formatMoney(-n)} <span className="text-xs font-medium">in advance</span></span>;
  return <span className="num text-sm text-muted">Settled</span>;
}

export default async function SuppliersPage({ searchParams }) {
  const user = await requirePageRole();
  const isAdmin = user.role === "admin";
  const sp = await searchParams;

  const [list, totals] = await Promise.all([
    getSuppliersPage({ q: sp.q, page: sp.page, owing: sp.owing === "1", isAdmin }),
    isAdmin ? getSupplierTotals() : null,
  ]);
  const page = Math.max(1, Number(sp.page) || 1);
  const rowHref = (r) => (isAdmin ? `/admin/suppliers/${r.id}` : `/admin/purchases?supplier=${r.id}`);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Suppliers"
        subtitle={isAdmin ? "Who you buy from, and what you owe each of them." : "Who you buy raw material from."}
        crumbs={[{ label: "Home", href: "/admin" }, { label: "Suppliers" }]}
        actions={
          <Link href="/admin/suppliers/new" className="btn-primary">
            <Plus size={18} aria-hidden /> Add Supplier
          </Link>
        }
      />

      {isAdmin ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
          <StatCard icon={Truck} label="Active suppliers" value={totals.suppliers} tone="info" valueTone="plain" />
          <StatCard icon={Wallet} label="Total to pay" value={formatMoney(totals.payable)} tone="danger" />
          <StatCard icon={CircleAlert} label="Suppliers owed money" value={totals.with_balance} tone="warning" />
        </div>
      ) : null}

      <FilterBar
        search={{ name: "q", label: "Search", value: sp.q, placeholder: "Search by name or phone..." }}
        selects={isAdmin ? [{ name: "owing", label: "Balance", allLabel: "All suppliers", value: sp.owing, options: [{ value: "1", label: "Only those we owe" }] }] : []}
      />

      <div className="card overflow-hidden">
        {list.rows.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No suppliers found"
            action={<Link href="/admin/suppliers/new" className="btn-primary"><Plus size={18} aria-hidden /> Add a supplier</Link>}
          >
            Nothing matches this search.
          </EmptyState>
        ) : (
          <>
            <ul className="divide-y divide-border md:hidden">
              {list.rows.map((r) => (
                <li key={r.id} className={r.active ? "" : "opacity-60"}>
                  <Link href={rowHref(r)} className="flex items-start justify-between gap-3 px-4 py-4 active:bg-background">
                    <span className="min-w-0">
                      <span className="block font-semibold text-heading">{r.name}</span>
                      <span className="block text-xs text-muted">{r.phone || "No phone"}</span>
                    </span>
                    {isAdmin ? <span className="shrink-0 text-right"><Balance value={r.balance} /></span> : null}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto md:block">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Supplier</th>
                    <th scope="col">Phone</th>
                    {isAdmin ? <th scope="col">Last purchase</th> : null}
                    {isAdmin ? <th scope="col" className="text-right">Balance</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {list.rows.map((r) => (
                    <tr key={r.id} className={r.active ? "" : "opacity-60"}>
                      <td className="min-w-[220px]">
                        <Link href={rowHref(r)} className="font-semibold text-heading hover:text-primary">{r.name}</Link>
                        {r.active ? null : <Badge tone="gray" className="ml-2">Inactive</Badge>}
                      </td>
                      <td className="whitespace-nowrap text-sm text-secondary">{r.phone || "None"}</td>
                      {isAdmin ? <td className="whitespace-nowrap text-sm text-secondary">{r.last_purchase ? formatDate(r.last_purchase) : "None yet"}</td> : null}
                      {isAdmin ? <td className="text-right"><Balance value={r.balance} /></td> : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} perPage={PAGE_SIZE} total={list.total} basePath="/admin/suppliers" params={sp} />
          </>
        )}
      </div>
    </div>
  );
}
