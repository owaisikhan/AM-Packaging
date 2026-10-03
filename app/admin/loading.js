import { HeaderSkeleton, StatCardsSkeleton, ChartCardSkeleton } from "@/app/_components/ui/PageSkeletons";

// Shown while any admin page without its own loading.js renders: the
// dashboard, detail pages and forms, whose titles depend on the data.
export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6">
      <HeaderSkeleton />
      <StatCardsSkeleton count={4} />
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
    </div>
  );
}
