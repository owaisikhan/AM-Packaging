import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePageRole, ROLES } from "@/app/_lib/helpers";
import { getCustomer } from "@/app/_lib/data-service";
import PageHeader from "@/app/_components/layout/PageHeader";
import CustomerForm from "@/app/_components/admin/CustomerForm";

export const metadata = { title: "Edit Customer" };

export default async function EditCustomerPage({ params }) {
  await requirePageRole(ROLES.ADMIN);
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Edit ${customer.name}`}
        subtitle="Changes are recorded in the activity log."
        crumbs={[{ label: "Home", href: "/admin" }, { label: "Customers", href: "/admin/customers" }, { label: customer.name, href: `/admin/customers/${id}` }, { label: "Edit" }]}
        actions={
          <Link href={`/admin/customers/${id}`} className="btn-secondary">
            <ArrowLeft size={17} aria-hidden /> Back to ledger
          </Link>
        }
      />
      <CustomerForm customer={customer} isAdmin afterSave={`/admin/customers/${id}`} />
    </div>
  );
}
