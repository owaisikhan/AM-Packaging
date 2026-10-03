import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Ban, Plus } from "lucide-react";
import { requirePageRole } from "@/app/_lib/helpers";
import { getProductionRun } from "@/app/_lib/data-service";
import { formatQty } from "@/app/_lib/format-helpers";
import { formatDate, formatDateTime } from "@/app/_lib/date-helpers";
import { voidProduction } from "@/app/_lib/actions";
import PageHeader from "@/app/_components/layout/PageHeader";
import ReasonDialog from "@/app/_components/ui/ReasonDialog";
import RunStatus from "@/app/_components/admin/RunStatus";

export const metadata = { title: "Production run" };

function Difference({ qty, expected, unit }) {
  if (expected === null || expected === undefined) return <span className="text-sm text-muted">No recipe</span>;
  const d = Math.round((Number(qty) - Number(expected)) * 1000) / 1000;
  if (d === 0) return <span className="text-sm font-semibold text-primary">On recipe</span>;
  if (d > 0) return <span className="num text-sm font-semibold text-[#b45309] dark:text-warning">+{formatQty(d)} {unit} over</span>;
  return <span className="num text-sm font-semibold text-info">{formatQty(-d)} {unit} under</span>;
}

export default async function ProductionRunPage({ params, searchParams }) {
  const user = await requirePageRole();
  const isAdmin = user.role === "admin";
  const { id } = await params;
  const { saved } = await searchParams;
  const data = await getProductionRun(id);
  if (!data) notFound();
  const { run: r, materials } = data;
  const isVoid = r.status === "void";

  return (
    <div className="flex flex-col gap-6">
      {saved ? (
        <p role="status" className="rounded-xl bg-[#dcfce7] px-4 py-3 text-sm font-medium text-[#15803d] dark:bg-[#14532d] dark:text-[#4ade80]">
          Run {r.run_no} saved. {formatQty(r.qty_made)} {r.unit} added to stock and the materials taken out.
        </p>
      ) : null}
      <PageHeader
        title={`Production ${r.run_no}`}
        subtitle={`${formatDate(r.run_date)} · entered by ${r.created_by_name || "Unknown"} on ${formatDateTime(r.created_at)}`}
        crumbs={[{ label: "Home", href: "/admin" }, { label: "Production", href: "/admin/production" }, { label: r.run_no }]}
        badge={<RunStatus status={r.status} overRecipe={r.over_recipe} />}
        actions={
          <>
            <Link href="/admin/production" className="btn-secondary">
              <ArrowLeft size={17} aria-hidden /> Back
            </Link>
            <Link href={`/admin/production/new?product=${r.item_id}`} className="btn-secondary">
              <Plus size={17} aria-hidden /> Make this again
            </Link>
            {isAdmin && !isVoid ? (
              <ReasonDialog
                action={voidProduction}
                id={r.id}
                triggerLabel="Void run"
                icon={<Ban size={16} aria-hidden />}
                title={`Void production ${r.run_no}?`}
                warning={`The run stays in the records marked void. The raw materials go back into stock and the ${formatQty(r.qty_made)} ${r.unit} made are taken out. If some have already been sold, the void is refused.`}
                confirmLabel="Void run"
              />
            ) : null}
          </>
        }
      />

      {isVoid ? (
        <p role="alert" className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c] dark:border-[#7f1d1d] dark:bg-[#450a0a] dark:text-[#f87171]">
          <span className="font-semibold">This run is void.</span> Reason: {r.void_reason}
        </p>
      ) : null}

      <section className="card grid gap-5 p-5 sm:grid-cols-3 sm:p-6">
        <div className="sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">Product made</p>
          <Link href={`/admin/stock/${r.item_id}`} className="mt-1 block text-lg font-bold text-heading hover:text-primary">{r.item_name}</Link>
          <p className="text-sm text-muted">{r.category_name}{r.item_code ? ` · ${r.item_code}` : ""}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">Quantity made</p>
          <p className={`num mt-1 text-[28px] font-extrabold leading-tight text-primary ${isVoid ? "line-through opacity-60" : ""}`}>
            {formatQty(r.qty_made)} <span className="text-base font-semibold text-muted">{r.unit}</span>
          </p>
        </div>
        {r.notes ? <p className="rounded-xl bg-background px-4 py-3 text-sm text-secondary sm:col-span-3">{r.notes}</p> : null}
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="card-title">Raw materials used</h2>
          <p className="text-xs text-muted">What the recipe said for this quantity, and what was really used.</p>
        </div>
        <ul className="divide-y divide-border lg:hidden">
          {materials.map((m) => (
            <li key={m.id} className="flex items-start justify-between gap-3 px-5 py-4">
              <span className="min-w-0">
                <Link href={`/admin/stock/${m.raw_item_id}`} className="block font-semibold text-heading hover:text-primary">{m.item_name}</Link>
                <span className="num block text-xs text-muted">
                  Recipe: {m.expected_qty === null ? "none" : `${formatQty(m.expected_qty)} ${m.unit}`}
                </span>
                <Difference qty={m.qty} expected={m.expected_qty} unit={m.unit} />
              </span>
              <span className="num shrink-0 text-right font-bold text-heading">
                {formatQty(m.qty)} <span className="text-xs font-medium text-muted">{m.unit}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto lg:block">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Raw material</th>
                <th scope="col" className="text-right">Recipe says</th>
                <th scope="col" className="text-right">Actually used</th>
                <th scope="col">Difference</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => (
                <tr key={m.id}>
                  <td><Link href={`/admin/stock/${m.raw_item_id}`} className="font-semibold text-heading hover:text-primary">{m.item_name}</Link></td>
                  <td className="num text-right text-secondary">{m.expected_qty === null ? "None" : `${formatQty(m.expected_qty)} ${m.unit}`}</td>
                  <td className="num text-right font-bold text-heading">{formatQty(m.qty)} <span className="text-xs font-medium text-muted">{m.unit}</span></td>
                  <td><Difference qty={m.qty} expected={m.expected_qty} unit={m.unit} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
