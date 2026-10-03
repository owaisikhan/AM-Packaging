"use client";

import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartTooltip from "./ChartTooltip";
import { axisFormatter, valueFormatter } from "./format";

const AXIS_TICK = { fill: "var(--color-muted)", fontSize: 12 };

/**
 * Change over time. data rows: { tick, label, [series.key]: number }.
 * series: [{ key, label, color: "--series-1" }]. variant "area" washes the
 * area under each 2px line at 10%; "line" is lines only.
 */
export default function TrendChart({ data, series, format = "money", unit, variant = "area", height = 280 }) {
  const fmt = valueFormatter(format, unit);
  const Chart = variant === "line" ? LineChart : AreaChart;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height }}>
        <Chart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="tick" tickLine={false} axisLine={{ stroke: "var(--chart-axis)" }} tick={AXIS_TICK} minTickGap={18} interval="preserveStartEnd" />
          <YAxis tickFormatter={axisFormatter(format)} tickLine={false} axisLine={false} tick={AXIS_TICK} width={format === "money" ? 100 : 60} allowDecimals={false} />
          <Tooltip content={<ChartTooltip format={fmt} />} cursor={{ stroke: "var(--color-muted)", strokeWidth: 1 }} isAnimationActive={false} />
          {series.map((s) =>
            variant === "line" ? (
              <Line
                key={s.key}
                type="linear"
                dataKey={s.key}
                name={s.label}
                stroke={`var(${s.color})`}
                strokeWidth={2}
                strokeLinecap="round"
                dot={false}
                activeDot={{ r: 5, stroke: "var(--color-surface)", strokeWidth: 2 }}
                connectNulls
                isAnimationActive={false}
              />
            ) : (
              <Area
                key={s.key}
                type="linear"
                dataKey={s.key}
                name={s.label}
                stroke={`var(${s.color})`}
                strokeWidth={2}
                fill={`var(${s.color})`}
                fillOpacity={0.1}
                dot={false}
                activeDot={{ r: 5, stroke: "var(--color-surface)", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            ),
          )}
        </Chart>
      </ResponsiveContainer>
    </div>
  );
}
