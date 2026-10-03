import ItemEditPage from "@/app/_components/admin/ItemEditPage";

export const metadata = { title: "Add Raw Material" };

export default function NewItemPage() {
  return <ItemEditPage kind="raw" />;
}
