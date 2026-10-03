import { ListPageSkeleton } from "@/app/_components/ui/PageSkeletons";

export default function Loading() {
  return (
    <ListPageSkeleton
      title="Activity"
      subtitle="Every action performed in the app: who did it, when, and what changed. Entries cannot be edited or deleted."
      actions
      selects={5}
      columns={[
        { label: "When", bar: "w-28", sub: "w-16" },
        { label: "User", bar: "w-32" },
        { label: "Action", bar: "w-20" },
        { label: "What happened", bar: "w-80" },
        { label: "Details", bar: "w-12", align: "right" },
      ]}
    />
  );
}
