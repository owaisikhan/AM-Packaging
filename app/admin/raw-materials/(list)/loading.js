import { COPY } from "@/app/_components/admin/ItemsListPage";
import { ListPageSkeleton } from "@/app/_components/ui/PageSkeletons";

export default function Loading() {
  const copy = COPY.raw;
  return (
    <ListPageSkeleton
      title={copy.title}
      subtitle={copy.subtitle}
      crumb={copy.crumb}
      actions
      selects={3}
      columns={[
        { label: "Item", bar: "w-48", sub: "w-24" },
        { label: "Category", bar: "w-24" },
        { label: "Details", bar: "w-32" },
        { label: "In stock", bar: "w-20", align: "right" },
        { label: "Low at", bar: "w-14", align: "right" },
        { label: "Status", bar: "w-20" },
      ]}
    />
  );
}
