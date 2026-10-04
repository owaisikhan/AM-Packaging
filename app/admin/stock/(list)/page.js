import { requirePagePermission } from "@/app/_lib/helpers";
import ItemsListPage from "@/app/_components/admin/ItemsListPage";

export const metadata = { title: "Stock" };

export default async function StockPage({ searchParams }) {
  const user = await requirePagePermission("stock_view");
  return <ItemsListPage searchParams={searchParams} basePath="/admin/stock" user={user} />;
}
