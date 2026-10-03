import { requirePageRole } from "@/app/_lib/helpers";
import ItemsListPage from "@/app/_components/admin/ItemsListPage";

export const metadata = { title: "Stock" };

export default async function StockPage({ searchParams }) {
  const user = await requirePageRole();
  return <ItemsListPage searchParams={searchParams} basePath="/admin/stock" user={user} />;
}
