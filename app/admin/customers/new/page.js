import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePagePermission, can } from "@/app/_lib/helpers";
import PageHeader from "@/app/_components/layout/PageHeader";
import CustomerForm from "@/app/_components/admin/CustomerForm";

export const metadata = { title: "Add Customer" };

export default async function NewCustomerPage({ searchParams }) {
  const user = await requirePagePermission("customers");
  // Opened from a new invoice form: save, then go straight back to it with this one picked.
  const fromForm = (await searchParams).from === "invoice";
  const isAdmin = user.role === "admin";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Add Customer"
        subtitle={fromForm ? "Fields marked * are required. Saving takes you back to the invoice with this customer picked." : "Fields marked * are required."}
        crumbs={[{ label: "Home", href: "/admin" }, { label: "Customers", href: "/admin/customers" }, { label: "Add" }]}
        actions={
          <Link href={fromForm ? "/admin/sales/new" : "/admin/customers"} className="btn-secondary">
            <ArrowLeft size={17} aria-hidden /> {fromForm ? "Back to New Invoice" : "Back to Customers"}
          </Link>
        }
      />
      <CustomerForm isAdmin={isAdmin} afterSave={fromForm ? "/admin/sales/new?customer=:id" : can(user, "balances") ? "/admin/customers/:id" : "/admin/customers"} />
    </div>
  );
}
