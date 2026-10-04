import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePagePermission, can } from "@/app/_lib/helpers";
import { getItemOptions, getSettings, getSupplierOptions } from "@/app/_lib/data-service";
import { todayISO } from "@/app/_lib/date-helpers";
import PageHeader from "@/app/_components/layout/PageHeader";
import PurchaseForm from "@/app/_components/admin/PurchaseForm";

export const metadata = { title: "New Purchase" };

export default async function NewPurchasePage({ searchParams }) {
  const user = await requirePagePermission("purchases");
  const { supplier } = await searchParams;
  const [suppliers, items, settings] = await Promise.all([getSupplierOptions(), getItemOptions("raw"), getSettings()]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New Purchase"
        subtitle="Record raw material bought from a supplier. Fields marked * are required."
        crumbs={[{ label: "Home", href: "/admin" }, { label: "Purchases", href: "/admin/purchases" }, { label: "New" }]}
        actions={
          <Link href="/admin/purchases" className="btn-secondary">
            <ArrowLeft size={17} aria-hidden /> Back to Purchases
          </Link>
        }
      />
      <PurchaseForm
        suppliers={suppliers}
        items={items}
        settings={settings}
        canPay={can(user, "payments")}
        today={todayISO()}
        initialSupplier={supplier}
      />
    </div>
  );
}
