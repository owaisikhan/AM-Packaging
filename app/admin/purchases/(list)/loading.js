import { ListPageSkeleton } from "@/app/_components/ui/PageSkeletons";

export default function Loading() {
  return (
    <ListPageSkeleton
      title="Purchases"
      subtitle="Raw material bought from suppliers. Saving a purchase adds its quantities to stock."
      actions
      statsClass="2xl:grid-cols-4"
      selects={4}
      columns={[
        { label: "Purchase", bar: "w-24", sub: "w-20" },
        { label: "Date", bar: "w-24" },
        { label: "Supplier", bar: "w-44" },
        { label: "Items", bar: "w-8", align: "right" },
        { label: "Total", bar: "w-24", align: "right" },
        { label: "Status", bar: "w-20" },
      ]}
    />
  );
}
