import { ListPageSkeleton } from "@/app/_components/ui/PageSkeletons";

export default function Loading() {
  return (
    <ListPageSkeleton
      title="Production"
      subtitle="Every manufacturing run: what was made and the raw materials it used. Saving a run adds the product to stock and takes the materials out."
      actions
      selects={3}
      columns={[
        { label: "Run", bar: "w-24" },
        { label: "Date", bar: "w-24" },
        { label: "Product", bar: "w-48" },
        { label: "Made", bar: "w-16", align: "right" },
        { label: "Materials", bar: "w-10", align: "right" },
        { label: "Status", bar: "w-20" },
      ]}
    />
  );
}
