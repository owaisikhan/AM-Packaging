import { ListPageSkeleton } from "@/app/_components/ui/PageSkeletons";

export default function Loading() {
  return (
    <ListPageSkeleton
      title="Sales & Invoices"
      subtitle="Invoices to customers. Saving an invoice takes its products out of stock."
      actions
      statsClass="2xl:grid-cols-4"
      selects={4}
      columns={[
        { label: "Invoice", bar: "w-24", sub: "w-20" },
        { label: "Date", bar: "w-24" },
        { label: "Customer", bar: "w-44" },
        { label: "Items", bar: "w-8", align: "right" },
        { label: "Total", bar: "w-24", align: "right" },
        { label: "Status", bar: "w-20" },
      ]}
    />
  );
}
