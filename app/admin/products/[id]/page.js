import ItemEditPage from "@/app/_components/admin/ItemEditPage";

export const metadata = { title: "Edit item" };

export default async function EditItemPage({ params }) {
  const { id } = await params;
  return <ItemEditPage kind="finished" id={id} />;
}
