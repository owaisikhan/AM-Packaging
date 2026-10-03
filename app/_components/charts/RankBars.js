import Link from "next/link";
import clsx from "clsx";

/**
 * A ranked list as bars: the name and the figure in text on one line, a
 * thin bar under it scaled to the largest value. Long names wrap instead of
 * being cut, and every figure is printed, so nothing needs a hover.
 *
 * rows: [{ key, label, value, display, href, sub }]. color: "--series-1".
 * diverging: bars grow left (under) or right (over) from a centre line.
 */
export default function RankBars({ rows, color = "--series-1", diverging = false }) {
  const max = Math.max(...rows.map((r) => Math.abs(r.value)), 0) || 1;
  return (
    <ul className="flex flex-col gap-4">
      {rows.map((r) => {
        const pct = Math.max((Math.abs(r.value) / max) * 100, r.value === 0 ? 0 : 1.5);
        const name = r.href ? (
          <Link href={r.href} className="font-medium text-heading hover:text-primary-ink hover:underline">{r.label}</Link>
        ) : (
          <span className="font-medium text-heading">{r.label}</span>
        );
        return (
          <li key={r.key}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0">
                {name}
                {r.sub ? <span className="ml-1.5 text-xs text-muted">{r.sub}</span> : null}
              </span>
              <span className="num shrink-0 font-semibold text-heading">{r.display}</span>
            </div>
            {diverging ? (
              <div className="mt-1.5 grid h-2.5 grid-cols-2" aria-hidden>
                <div className="flex justify-end border-r border-[var(--chart-axis)] pr-px">
                  {r.value < 0 ? <span className="h-full rounded-l-[4px]" style={{ width: `${pct}%`, background: "var(--div-under)" }} /> : null}
                </div>
                <div className="flex pl-px">
                  {r.value > 0 ? <span className="h-full rounded-r-[4px]" style={{ width: `${pct}%`, background: "var(--div-over)" }} /> : null}
                </div>
              </div>
            ) : (
              <div className="mt-1.5 h-2.5" aria-hidden>
                <span className={clsx("block h-full rounded-r-[4px]")} style={{ width: `${pct}%`, background: `var(${color})` }} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
