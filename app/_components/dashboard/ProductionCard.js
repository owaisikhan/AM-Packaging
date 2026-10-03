"use client";

import { useState } from "react";
import ChartFrame from "@/app/_components/charts/ChartFrame";
import ColumnChart from "@/app/_components/charts/ColumnChart";
import Pills from "./Pills";

/**
 * Made per day, one product category at a time: cartons, rolls and bundles
 * are different units and are never added together.
 * categories: [{ id, name, unit, total, data, table, empty }]
 */
export default function ProductionCard({ categories, subtitle, className }) {
  const [id, setId] = useState(categories[0]?.id);
  const c = categories.find((x) => x.id === id) ?? categories[0];
  if (!c) {
    return <ChartFrame className={className} title="Production output" subtitle={subtitle} empty emptyText="Add a product to see production here." />;
  }
  return (
    <ChartFrame
      className={className}
      title="Production output"
      subtitle={`${subtitle}. ${c.name}: ${c.total} in all.`}
      table={c.table}
      empty={c.empty}
      emptyText={`No ${c.name.toLowerCase()} made in the last 30 days.`}
      controls={
        categories.length > 1 ? (
          <Pills label="Product type" value={c.id} onChange={setId} options={categories.map((x) => ({ value: x.id, label: `${x.name} (${x.unit})` }))} />
        ) : null
      }
    >
      <ColumnChart data={c.data} series={[{ key: "qty", label: `${c.name} made`, color: "--series-1" }]} format="qty" unit={c.unit} />
    </ChartFrame>
  );
}
