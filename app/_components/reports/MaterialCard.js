"use client";

import { useState } from "react";
import ChartFrame from "@/app/_components/charts/ChartFrame";
import ColumnChart from "@/app/_components/charts/ColumnChart";

// Each material has its own unit, so the chart shows one at a time.
export default function MaterialCard({ title, subtitle, materials, empty, emptyText, className }) {
  const [id, setId] = useState(materials[0]?.id);
  const m = materials.find((x) => x.id === id) ?? materials[0];
  if (empty || !m) return <ChartFrame className={className} title={title} subtitle={subtitle} empty emptyText={emptyText} />;
  const series = [
    { key: "used", label: `Used (${m.unit})`, color: "--series-1" },
    { key: "expected", label: `Recipe (${m.unit})`, color: "--series-2" },
  ];
  return (
    <ChartFrame
      className={className}
      title={title}
      subtitle={subtitle}
      legend={series.map((s) => ({ ...s, shape: "rect" }))}
      table={m.table}
      empty={m.empty}
      emptyText={`No ${m.name} used in this period.`}
      controls={
        <div className="w-full sm:w-80">
          <label htmlFor="mat-pick" className="sr-only">Material</label>
          <select id="mat-pick" value={m.id} onChange={(e) => setId(e.target.value)} className="form-select">
            {materials.map((x) => (
              <option key={x.id} value={x.id}>{x.name} ({x.unit})</option>
            ))}
          </select>
        </div>
      }
    >
      <ColumnChart data={m.data} series={series} format="qty" unit={m.unit} />
    </ChartFrame>
  );
}
