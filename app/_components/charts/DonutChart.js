"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

function SliceTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm shadow-lg">
      <span className="num font-bold text-heading">{p.value}</span> <span className="text-secondary">{p.name}</span>
    </div>
  );
}

/**
 * Part of a whole, six slices at most. slices: [{ key, label, value, color }].
 * Slices are parted by a 2px gap in the card colour; the total sits in the
 * middle. The legend beside it carries every figure in words.
 */
export default function DonutChart({ slices, centerValue, centerLabel, size = 200 }) {
  const shown = slices.filter((s) => s.value > 0);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: size, height: size }}>
        <PieChart>
          <Pie data={shown} dataKey="value" nameKey="label" innerRadius="68%" outerRadius="100%" stroke="var(--color-surface)" strokeWidth={2} startAngle={90} endAngle={-270} isAnimationActive={false}>
            {shown.map((s) => (
              <Cell key={s.key} fill={`var(${s.color})`} />
            ))}
          </Pie>
          <Tooltip content={<SliceTooltip />} isAnimationActive={false} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[28px] font-extrabold leading-none text-heading">{centerValue}</span>
        <span className="mt-1 text-xs font-medium text-muted">{centerLabel}</span>
      </div>
    </div>
  );
}
