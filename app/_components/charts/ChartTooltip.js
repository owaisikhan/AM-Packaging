"use client";

// One tooltip for every series at the pointer: the value leads, the series
// name follows, keyed by a short line in the series colour.
export default function ChartTooltip({ active, payload, format }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="min-w-[180px] rounded-xl border border-border bg-surface px-3.5 py-3 text-sm shadow-lg">
      <p className="mb-2 text-xs font-semibold text-muted">{row.label}</p>
      <ul className="flex flex-col gap-1.5">
        {payload.map((p) => (
          <li key={p.dataKey} className="flex items-center gap-2.5">
            <span className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: p.color }} aria-hidden />
            <span className="num font-bold text-heading">{format(p.value)}</span>
            <span className="text-secondary">{p.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
