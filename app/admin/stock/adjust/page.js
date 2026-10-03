import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePageRole, ROLES } from "@/app/_lib/helpers";
import { getItemOptions } from "@/app/_lib/data-service";
import { todayISO } from "@/app/_lib/date-helpers";
import PageHeader from "@/app/_components/layout/PageHeader";
import AdjustStockForm from "@/app/_components/admin/AdjustStockForm";

export const metadata = { title: "Opening stock / Adjust" };

export default async function AdjustStockPage({ searchParams }) {
  await requirePageRole(ROLES.ADMIN);
  const { item = "" } = await searchParams;
  const items = await getItemOptions();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Opening stock / Adjust"
        subtitle="Enter the first count of an item, or correct stock after a physical count. Every entry is kept in the item's history and the activity log."
        crumbs={[{ label: "Home", href: "/admin" }, { label: "Stock", href: "/admin/stock" }, { label: "Adjust" }]}
        actions={
          <Link href="/admin/stock" className="btn-secondary">
            <ArrowLeft size={17} aria-hidden /> Back to Stock
          </Link>
        }
      />
      <AdjustStockForm items={items} initialItem={item} today={todayISO()} />
    </div>
  );
}
