"use client";

import { useState } from "react";
import ChartFrame from "@/app/_components/charts/ChartFrame";
import ColumnChart from "@/app/_components/charts/ColumnChart";
import Pills from "./Pills";

const SERIES = [
  { key: "sales", label: "Sales", color: "--series-1" },
  { key: "purchases", label: "Purchases", color: "--series-2" },
];

/** views: { day, week, month } each { subtitle, data, table, empty } */
export default function SalesPurchasesCard({ views, className }) {
  const [grain, setGrain] = useState("day");
  const v = views[grain];
  return (
    <ChartFrame
      className={className}
      title="Sales vs Purchases"
      subtitle={v.subtitle}
      legend={SERIES.map((s) => ({ ...s, shape: "rect" }))}
      table={v.table}
      empty={v.empty}
      emptyText="No sales or purchases in this period yet."
      controls={
        <Pills
          label="Group by"
          value={grain}
          onChange={setGrain}
          options={[
            { value: "day", label: "Daily" },
            { value: "week", label: "Weekly" },
            { value: "month", label: "Monthly" },
          ]}
        />
      }
    >
      <ColumnChart data={v.data} series={SERIES} format="money" />
    </ChartFrame>
  );
}
