"use client";

import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import ChartTooltip from "./ChartTooltip";
import { axisFormatter, valueFormatter } from "./format";

const AXIS_TICK = { fill: "var(--color-muted)", fontSize: 12 };

/**
 * Columns per period, side by side when there is more than one series, with
 * an optional line on the same axis (for example gross profit over revenue
 * and cost: all rupees, so one axis). Bars are at most 24px wide with a 4px
 * rounded top, square at the baseline.
 */
export default function ColumnChart({ data, series, line, format = "money", unit, height = 280 }) {
  const fmt = valueFormatter(format, unit);
  const hasNegative = data.some((d) => [...series, ...(line ? [line] : [])].some((s) => d[s.key] < 0));
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height }}>
        <ComposedChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }} barGap={2} barCategoryGap="20%">
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="tick" tickLine={false} axisLine={{ stroke: "var(--chart-axis)" }} tick={AXIS_TICK} minTickGap={12} interval="preserveStartEnd" />
          <YAxis tickFormatter={axisFormatter(format)} tickLine={false} axisLine={false} tick={AXIS_TICK} width={format === "money" ? 100 : 60} allowDecimals={false} />
          {hasNegative ? <ReferenceLine y={0} stroke="var(--chart-axis)" /> : null}
          <Tooltip content={<ChartTooltip format={fmt} />} cursor={{ fill: "var(--color-background)", opacity: 0.7 }} isAnimationActive={false} />
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={`var(${s.color})`} maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          ))}
          {line ? (
            <Line
              type="linear"
              dataKey={line.key}
              name={line.label}
              stroke={`var(${line.color})`}
              strokeWidth={2}
              dot={{ r: 4, fill: `var(${line.color})`, stroke: "var(--color-surface)", strokeWidth: 2 }}
              activeDot={{ r: 5, stroke: "var(--color-surface)", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
