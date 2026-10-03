"use client";

import { useState } from "react";
import { BarChart3, Table2 } from "lucide-react";
import clsx from "clsx";

/**
 * A chart card: title, optional controls (period pills, a picker), a legend
 * for two or more series, the chart, and a Table view of the same figures so
 * no value depends on hovering or on telling colours apart.
 *
 * table: { columns: [{ label, align }], rows: [[cell, ...]] } with cells
 * already formatted as text.
 * legend: [{ label, color: "--series-1", shape: "rect" | "line" }]
 */
export default function ChartFrame({ title, subtitle, controls, legend = [], table, empty = false, emptyText, footnote, children, className }) {
  const [view, setView] = useState("chart");
  return (
    <section className={clsx("card flex min-w-0 flex-col", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h2 className="card-title">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-muted">{subtitle}</p> : null}
        </div>
        {table && !empty ? (
          <div className="flex rounded-lg bg-background p-1" role="group" aria-label={`Show ${title} as`}>
            {[
              ["chart", "Chart", BarChart3],
              ["table", "Table", Table2],
            ].map(([v, label, Icon]) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={clsx(
                  "flex min-h-[36px] items-center gap-1.5 rounded-md px-3 text-[13px] font-semibold",
                  view === v ? "bg-surface text-heading shadow-sm" : "text-secondary hover:text-heading",
                )}
              >
                <Icon size={15} aria-hidden /> {label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {controls ? <div className="flex flex-wrap items-center gap-2 px-5 pt-4">{controls}</div> : null}

      {empty ? (
        <p className="flex min-h-[180px] flex-1 items-center justify-center px-5 py-10 text-center text-sm text-muted">{emptyText ?? "Nothing recorded in this period yet."}</p>
      ) : view === "chart" ? (
        <div className="flex flex-1 flex-col gap-3 px-3 pb-4 pt-4 sm:px-5">
          {legend.length > 1 ? (
            <ul className="flex flex-wrap gap-x-5 gap-y-1.5 px-2 text-[13px] text-secondary sm:px-0">
              {legend.map((l) => (
                <li key={l.label} className="flex items-center gap-2">
                  <span
                    className={l.shape === "line" ? "h-0.5 w-4 rounded-full" : "h-3 w-3 rounded-[3px]"}
                    style={{ background: `var(${l.color})` }}
                    aria-hidden
                  />
                  {l.label}
                </li>
              ))}
            </ul>
          ) : null}
          {children}
        </div>
      ) : (
        <div className="max-h-[420px] overflow-auto">
          <table className="data-table">
            <thead>
              <tr>
                {table.columns.map((c) => (
                  <th key={c.label} scope="col" className={c.align === "right" ? "text-right" : ""}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((cell, j) => (
                    <td key={j} className={clsx("text-sm", table.columns[j].align === "right" ? "num text-right" : "text-text", j === 0 && "font-medium")}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {footnote && !empty ? <p className="border-t border-border px-5 py-3 text-xs text-muted">{footnote}</p> : null}
    </section>
  );
}
