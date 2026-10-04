import { requirePagePermission } from "@/app/_lib/helpers";
import ItemsListPage from "@/app/_components/admin/ItemsListPage";

export const metadata = { title: "Raw Materials" };

export default async function RawMaterialsPage({ searchParams }) {
  const user = await requirePagePermission("stock_view");
  return <ItemsListPage kind="raw" searchParams={searchParams} basePath="/admin/raw-materials" user={user} />;
}
