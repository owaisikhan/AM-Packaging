import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePagePermission, can } from "@/app/_lib/helpers";
import { getCustomerOptions, getItemOptions, getSettings } from "@/app/_lib/data-service";
import { todayISO } from "@/app/_lib/date-helpers";
import PageHeader from "@/app/_components/layout/PageHeader";
import SaleForm from "@/app/_components/admin/SaleForm";

export const metadata = { title: "New Invoice" };

export default async function NewSalePage({ searchParams }) {
  const user = await requirePagePermission("sales");
  const { customer } = await searchParams;
  const [customers, items, settings] = await Promise.all([getCustomerOptions(), getItemOptions("finished"), getSettings()]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New Invoice"
        subtitle="Sell products to a customer. Fields marked * are required."
        crumbs={[{ label: "Home", href: "/admin" }, { label: "Sales & Invoices", href: "/admin/sales" }, { label: "New" }]}
        actions={
          <Link href="/admin/sales" className="btn-secondary">
            <ArrowLeft size={17} aria-hidden /> Back to Sales
          </Link>
        }
      />
      <SaleForm customers={customers} items={items} settings={settings} today={todayISO()} initialCustomer={customer} canTakeCash={can(user, "sales_cash") || can(user, "payments")} />
    </div>
  );
}
