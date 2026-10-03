import { ListPageSkeleton } from "@/app/_components/ui/PageSkeletons";

export default function Loading() {
  return (
    <ListPageSkeleton
      title="Users"
      subtitle="Who can sign in, and what they can do. Admins see everything; workers record production, purchases and sales."
      actions
      stats={3}
      statsClass="sm:grid-cols-3"
      search={false}
      selects={0}
      columns={[
        { label: "Name", bar: "w-44", sub: "w-32" },
        { label: "Role", bar: "w-16" },
        { label: "Status", bar: "w-16" },
        { label: "Actions", bar: "w-24", align: "right" },
      ]}
    />
  );
}
