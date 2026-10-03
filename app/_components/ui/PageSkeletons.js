// Loading screens in the PMC style: anything known before the data arrives
// (page titles, fixed descriptions, column headings) renders for real, and
// only the figures are placeheld, at their real line heights, so nothing
// jumps when the page lands. Used by the loading.js files under app/admin.

import clsx from "clsx";
import PageHeader from "@/app/_components/layout/PageHeader";
import { Skeleton, SkeletonLine } from "@/app/_components/ui/Skeleton";

/** The header card when the title depends on the data (a customer's name). */
export function HeaderSkeleton({ crumbs = 2 }) {
  return (
    <div className="page-header" aria-busy="true">
      <div className="flex min-w-0 flex-col gap-1">
        <SkeletonLine line="h-4" bar="h-3" width={crumbs > 2 ? "w-56" : "w-36"} />
        <SkeletonLine line="h-9" bar="h-7" width="w-64 max-w-full" delay={0.05} />
        <SkeletonLine line="h-5" bar="h-3.5" width="w-80 max-w-full" delay={0.1} />
      </div>
    </div>
  );
}

/** A row of StatCards with the icon tile, label and figure placeheld. */
export function StatCardsSkeleton({ count = 4, className = "xl:grid-cols-4" }) {
  return (
    <div className={clsx("grid grid-cols-2 gap-3 sm:gap-4", className)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="stat-card max-sm:flex-col max-sm:items-start max-sm:gap-3 max-sm:p-4">
          <Skeleton className="h-12 w-12 shrink-0 rounded-xl max-sm:h-10 max-sm:w-10" delay={i * 0.05} />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <SkeletonLine line="h-5" bar="h-3" width="w-24" delay={i * 0.05} />
            <SkeletonLine line="h-8" bar="h-6" width="w-28" delay={i * 0.05 + 0.03} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** The filter card: a search box and a few selects, at their real height. */
export function FilterSkeleton({ selects = 2, search = true }) {
  return (
    <div className="card grid gap-3 p-4 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end">
      {search ? <Skeleton className="h-11 rounded-[10px] sm:col-span-2 lg:min-w-[260px] lg:flex-1" /> : null}
      {Array.from({ length: selects }, (_, i) => (
        <Skeleton key={i} className="h-11 rounded-[10px] lg:w-52" delay={0.05 * (i + 1)} />
      ))}
    </div>
  );
}

/**
 * A list card: real column headings above placeheld rows from 1280px (as
 * the real tables), stacked cards below it.
 * columns: [{ label, bar: "w-24", align: "right", sub: "w-16" }]
 */
export function ListSkeleton({ columns, rows = 8 }) {
  return (
    <div className="card overflow-hidden" aria-busy="true">
      <ul className="divide-y divide-border xl:hidden">
        {Array.from({ length: rows }, (_, r) => (
          <li key={r} className="flex items-start justify-between gap-3 px-4 py-4">
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <SkeletonLine line="h-6" bar="h-4" width="w-44 max-w-full" delay={r * 0.08} />
              <SkeletonLine line="h-4" bar="h-3" width="w-28" delay={r * 0.08 + 0.03} />
            </span>
            <SkeletonLine line="h-6" bar="h-4" width="w-20" align="right" delay={r * 0.08 + 0.05} />
          </li>
        ))}
      </ul>
      <div className="hidden xl:block">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.label} scope="col" className={c.align === "right" ? "text-right" : ""}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, r) => (
              <tr key={r}>
                {columns.map((c, ci) => (
                  <td key={c.label}>
                    <SkeletonLine line="h-6" bar="h-4" width={c.bar ?? "w-24"} align={c.align} delay={r * 0.1 + ci * 0.03} />
                    {c.sub ? <SkeletonLine line="h-4" bar="h-3" width={c.sub} align={c.align} delay={r * 0.1 + ci * 0.03 + 0.04} /> : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** A chart card with its real title; the plot area is placeheld. */
export function ChartCardSkeleton({ title, height = 280, className }) {
  return (
    <section className={clsx("card flex min-w-0 flex-col", className)} aria-busy="true">
      <div className="border-b border-border px-5 py-4">
        {title ? <h2 className="card-title">{title}</h2> : <SkeletonLine line="h-6" bar="h-4" width="w-40" />}
        <SkeletonLine line="h-4" bar="h-3" width="w-56" delay={0.04} />
      </div>
      <div className="px-5 pb-5 pt-4">
        <div style={{ height }} className="flex items-end gap-[6%] px-4">
          {[0.35, 0.6, 0.45, 0.8, 0.55, 0.7, 0.4].map((h, i) => (
            <Skeleton key={i} className="w-full rounded-t-[4px] rounded-b-none" delay={i * 0.06} style={{ height: `${h * 100}%` }} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** A whole list page: real header, then stats, filters and the list. */
export function ListPageSkeleton({ title, subtitle, crumb, stats = 4, statsClass, selects = 2, search = true, columns, actions }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={title}
        subtitle={subtitle}
        crumbs={[{ label: "Home", href: "/admin" }, { label: crumb ?? title }]}
        actions={actions ? <Skeleton className="h-[42px] w-36 rounded-[10px]" /> : null}
      />
      {stats ? <StatCardsSkeleton count={stats} className={statsClass} /> : null}
      <FilterSkeleton selects={selects} search={search} />
      <ListSkeleton columns={columns} />
    </div>
  );
}
