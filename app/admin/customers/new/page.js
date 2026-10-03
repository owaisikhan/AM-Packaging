import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePageRole } from "@/app/_lib/helpers";
import PageHeader from "@/app/_components/layout/PageHeader";
import CustomerForm from "@/app/_components/admin/CustomerForm";

export const metadata = { title: "Add Customer" };

export default async function NewCustomerPage() {
  const user = await requirePageRole();
  const isAdmin = user.role === "admin";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Add Customer"
        subtitle="Fields marked * are required."
        crumbs={[{ label: "Home", href: "/admin" }, { label: "Customers", href: "/admin/customers" }, { label: "Add" }]}
        actions={
          <Link href="/admin/customers" className="btn-secondary">
            <ArrowLeft size={17} aria-hidden /> Back to Customers
          </Link>
        }
      />
      <CustomerForm isAdmin={isAdmin} afterSave={isAdmin ? "/admin/customers/:id" : "/admin/customers"} />
    </div>
  );
}
