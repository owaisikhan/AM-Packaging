import { requirePagePermission } from "@/app/_lib/helpers";
import ItemsListPage from "@/app/_components/admin/ItemsListPage";

export const metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }) {
  const user = await requirePagePermission("stock_view");
  return <ItemsListPage kind="finished" searchParams={searchParams} basePath="/admin/products" user={user} />;
}
