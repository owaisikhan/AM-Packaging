// The Reports tabs and period presets. Plain data, safe anywhere (the
// loading screen shows the tabs before the report is built).

export const REPORT_TABS = [
  { id: "sales", label: "Sales" },
  { id: "purchases", label: "Purchases" },
  { id: "production", label: "Production" },
  { id: "materials", label: "Raw material use" },
  { id: "stock", label: "Stock" },
  { id: "balances", label: "Receivables & Payables" },
  { id: "profit", label: "Profit" },
];

export const RANGE_PRESETS = [
  { value: "30d", label: "Last 30 days" },
  { value: "month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "90d", label: "Last 3 months" },
  { value: "year", label: "This year" },
  { value: "custom", label: "Pick dates" },
];
