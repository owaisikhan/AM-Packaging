import PageHeader from "@/app/_components/layout/PageHeader";
import { REPORT_TABS } from "@/app/_lib/report-tabs";
import { ChartCardSkeleton, FilterSkeleton, StatCardsSkeleton } from "@/app/_components/ui/PageSkeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports"
        subtitle="Charts and tables for sales, purchases, production, stock, balances and profit. Every chart has a Table view."
        crumbs={[{ label: "Home", href: "/admin" }, { label: "Reports" }]}
      />
      <div className="card flex flex-wrap gap-1 p-1.5">
        {REPORT_TABS.map((t) => (
          <span key={t.id} className="flex min-h-[44px] shrink-0 items-center whitespace-nowrap rounded-lg px-4 text-sm font-semibold text-secondary">{t.label}</span>
        ))}
      </div>
      <FilterSkeleton search={false} selects={2} />
      <StatCardsSkeleton count={3} className="xl:grid-cols-3" />
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCardSkeleton className="xl:col-span-2" />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
    </div>
  );
}
