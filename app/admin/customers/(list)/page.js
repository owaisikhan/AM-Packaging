import Link from "next/link";
import { Plus, Users, Wallet, CircleAlert } from "lucide-react";
import { requirePageRole } from "@/app/_lib/helpers";
import { getCustomersPage, getCustomerTotals, PAGE_SIZE } from "@/app/_lib/data-service";
import { formatMoney } from "@/app/_lib/format-helpers";
import { formatDate } from "@/app/_lib/date-helpers";
import PageHeader from "@/app/_components/layout/PageHeader";
import StatCard from "@/app/_components/ui/StatCard";
import FilterBar from "@/app/_components/ui/FilterBar";
import Pagination from "@/app/_components/ui/Pagination";
import EmptyState from "@/app/_components/ui/EmptyState";
import Badge from "@/app/_components/ui/Badge";

export const metadata = { title: "Customers" };

function Balance({ value }) {
  const n = Number(value);
  if (n > 0) return <span className="num font-bold text-danger-ink">{formatMoney(n)} <span className="text-xs font-medium">owes you</span></span>;
  if (n < 0) return <span className="num font-bold text-primary-ink">{formatMoney(-n)} <span className="text-xs font-medium">in advance</span></span>;
  return <span className="num text-sm text-muted">Settled</span>;
}

export default async function CustomersPage({ searchParams }) {
  const user = await requirePageRole();
  const isAdmin = user.role === "admin";
  const sp = await searchParams;

  const [list, totals] = await Promise.all([
    getCustomersPage({ q: sp.q, page: sp.page, owing: sp.owing === "1", isAdmin }),
    isAdmin ? getCustomerTotals() : null,
  ]);
  const page = Math.max(1, Number(sp.page) || 1);
  const rowHref = (r) => (isAdmin ? `/admin/customers/${r.id}` : `/admin/sales?customer=${r.id}`);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Customers"
        subtitle={isAdmin ? "Who you sell to, and what each of them owes you." : "Who you sell to."}
        crumbs={[{ label: "Home", href: "/admin" }, { label: "Customers" }]}
        actions={
          <Link href="/admin/customers/new" className="btn-primary">
            <Plus size={18} aria-hidden /> Add Customer
          </Link>
        }
      />

      {isAdmin ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
          <StatCard icon={Users} label="Active customers" value={totals.customers} tone="info" valueTone="plain" />
          <StatCard icon={Wallet} label="Total to receive" value={formatMoney(totals.receivable)} tone="danger" />
          <StatCard icon={CircleAlert} label="Customers who owe" value={totals.owing} tone="warning" />
        </div>
      ) : null}

      <FilterBar
        search={{ name: "q", label: "Search", value: sp.q, placeholder: "Search by name or phone..." }}
        selects={isAdmin ? [{ name: "owing", label: "Balance", allLabel: "All customers", value: sp.owing, options: [{ value: "1", label: "Only those who owe" }] }] : []}
      />

      <div className="card overflow-hidden">
        {list.rows.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers found"
            action={<Link href="/admin/customers/new" className="btn-primary"><Plus size={18} aria-hidden /> Add a customer</Link>}
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
                    <th scope="col">Customer</th>
                    <th scope="col">Phone</th>
                    {isAdmin ? <th scope="col">Last invoice</th> : null}
                    {isAdmin ? <th scope="col" className="text-right">Balance</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {list.rows.map((r) => (
                    <tr key={r.id} className={r.active ? "" : "opacity-60"}>
                      <td className="min-w-[220px]">
                        <Link href={rowHref(r)} className="tap-inline font-semibold text-heading hover:text-primary-ink">{r.name}</Link>
                        {r.active ? null : <Badge tone="gray" className="ml-2">Inactive</Badge>}
                      </td>
                      <td className="whitespace-nowrap text-sm text-secondary">{r.phone || "None"}</td>
                      {isAdmin ? <td className="whitespace-nowrap text-sm text-secondary">{r.last_sale ? formatDate(r.last_sale) : "None yet"}</td> : null}
                      {isAdmin ? <td className="text-right"><Balance value={r.balance} /></td> : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} perPage={PAGE_SIZE} total={list.total} basePath="/admin/customers" params={sp} />
          </>
        )}
      </div>
    </div>
  );
}
