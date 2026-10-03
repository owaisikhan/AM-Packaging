import { ListPageSkeleton } from "@/app/_components/ui/PageSkeletons";

// The subtitle differs for admins and workers, so it is left to the page.
export default function Loading() {
  return (
    <ListPageSkeleton
      title="Suppliers"
      actions
      stats={0}
      selects={1}
      columns={[
        { label: "Supplier", bar: "w-52" },
        { label: "Phone", bar: "w-28" },
      ]}
    />
  );
}
