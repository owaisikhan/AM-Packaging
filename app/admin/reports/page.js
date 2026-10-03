import Link from "next/link";
import clsx from "clsx";
import { BarChart3, Calculator, Download, Layers3 } from "lucide-react";
import { requirePageRole, ROLES } from "@/app/_lib/helpers";
import { buildReport, RANGE_PRESETS, REPORT_TABS, resolveRange } from "@/app/_lib/reports";
import { formatMoney } from "@/app/_lib/format-helpers";
import { formatDate, todayISO } from "@/app/_lib/date-helpers";
import PageHeader from "@/app/_components/layout/PageHeader";
import StatCard from "@/app/_components/ui/StatCard";
import ChartFrame from "@/app/_components/charts/ChartFrame";
import ColumnChart from "@/app/_components/charts/ColumnChart";
import RankBars from "@/app/_components/charts/RankBars";
import StackBar from "@/app/_components/charts/StackBar";
import MaterialCard from "@/app/_components/reports/MaterialCard";
import ReportFilters from "@/app/_components/reports/ReportFilters";

export const metadata = { title: "Reports" };

const CARD_ICONS = [BarChart3, Layers3, Calculator];

function Section({ s }) {
  const span = s.wide ? "xl:col-span-2" : "";
  if (s.kind === "material") {
    return <MaterialCard className={span} title={s.title} subtitle={s.subtitle} materials={s.materials} empty={s.empty} emptyText={s.emptyText} />;
  }
  if (s.kind === "table") {
    return (
      <section className={clsx("card overflow-hidden", span)}>
        <div className="border-b border-border px-5 py-4">
          <h2 className="card-title">{s.title}</h2>
          {s.subtitle ? <p className="mt-0.5 text-xs text-muted">{s.subtitle}</p> : null}
        </div>
        {s.empty ? (
          <p className="px-5 py-10 text-center text-sm text-muted">Nothing recorded in this period yet.</p>
        ) : (
          <>
          <ul className="divide-y divide-border sm:hidden">
            {s.table.rows.map((r, i) => (
              <li key={i} className="px-5 py-3.5">
                <p className="font-semibold text-heading">{r[0]}</p>
                <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-sm">
                  {r.slice(1).map((cell, j) => (
                    <div key={j} className="contents">
                      <dt className="text-secondary">{s.table.columns[j + 1].label}</dt>
                      <dd className={clsx("text-right text-heading", s.table.columns[j + 1].align === "right" && "num")}>{cell}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto sm:block">
            <table className="data-table">
              <thead>
                <tr>
                  {s.table.columns.map((c) => (
                    <th key={c.label} scope="col" className={c.align === "right" ? "text-right" : ""}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.table.rows.map((r, i) => (
                  <tr key={i}>
                    {r.map((cell, j) => (
                      <td key={j} className={clsx("text-sm", s.table.columns[j].align === "right" ? "num text-right" : "text-text", j === 0 && "font-medium text-heading")}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </section>
    );
  }
  const series = [...(s.series ?? []), ...(s.line ? [s.line] : [])];
  return (
    <ChartFrame
      className={span}
      title={s.title}
      subtitle={s.subtitle}
      table={s.table}
      empty={s.empty}
      emptyText={s.emptyText}
      footnote={s.footnote}
      legend={
        s.kind === "stacks"
          ? []
          : series.map((x) => ({ label: x.label, color: x.color, shape: x === s.line ? "line" : "rect" }))
      }
    >
      {s.kind === "columns" ? <ColumnChart data={s.data} series={s.series} line={s.line} format={s.format} unit={s.unit} /> : null}
      {s.kind === "rank" ? <RankBars rows={s.rows} color={s.color} diverging={s.diverging} /> : null}
      {s.kind === "stacks" ? (
        <div className="flex flex-col gap-7 py-2">
          {s.stacks.map((st) => (
            <StackBar key={st.key} title={st.title} total={st.total} segments={st.segments} format={formatMoney} />
          ))}
        </div>
      ) : null}
    </ChartFrame>
  );
}

export default async function ReportsPage({ searchParams }) {
  await requirePageRole(ROLES.ADMIN);
  const sp = await searchParams;
  const tab = REPORT_TABS.find((t) => t.id === sp.tab) ?? REPORT_TABS[0];
  const today = todayISO();
  const range = resolveRange(sp, today);
  const report = await buildReport(tab.id, range, today);

  const qs = new URLSearchParams({ tab: tab.id });
  for (const k of ["range", "from", "to", "group"]) if (sp[k]) qs.set(k, sp[k]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports"
        subtitle="Charts and tables for sales, purchases, production, stock, balances and profit. Every chart has a Table view."
        crumbs={[{ label: "Home", href: "/admin" }, { label: "Reports" }]}
        actions={
          <a href={`/admin/reports/export?${qs}`} className="btn-secondary" download>
            <Download size={17} aria-hidden /> Download CSV
          </a>
        }
      />

      <nav aria-label="Reports" className="card flex flex-wrap gap-1 p-1.5">
        {REPORT_TABS.map((t) => {
          const href = new URLSearchParams({ tab: t.id });
          for (const k of ["range", "from", "to"]) if (sp[k]) href.set(k, sp[k]);
          return (
            <Link
              key={t.id}
              href={`/admin/reports?${href}`}
              aria-current={t.id === tab.id ? "page" : undefined}
              className={clsx(
                "flex min-h-[44px] shrink-0 items-center whitespace-nowrap rounded-lg px-4 text-sm font-semibold",
                t.id === tab.id ? "bg-primary-light text-primary-ink" : "text-secondary hover:bg-background hover:text-heading",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      {report.asOf ? (
        <p className="card px-5 py-4 text-sm text-secondary">
          Balances as of today, <span className="font-semibold text-heading">{formatDate(today)}</span>. The period does not apply to this report.
        </p>
      ) : (
        <ReportFilters key={`${tab.id}-${range.preset}`} tab={tab.id} presets={RANGE_PRESETS} range={range} />
      )}

      <div className={clsx("grid grid-cols-2 gap-3 sm:gap-4", report.cards.length >= 3 && "xl:grid-cols-3")}>
        {report.cards.map((c, i) => (
          <StatCard key={c.label} icon={CARD_ICONS[i % CARD_ICONS.length]} label={c.label} value={c.value} note={c.note} tone={c.tone} valueTone={c.plain ? "plain" : undefined} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {report.sections.map((s) => (
          <Section key={s.id} s={s} />
        ))}
      </div>
    </div>
  );
}
