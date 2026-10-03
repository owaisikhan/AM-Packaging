import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePageRole, ROLES } from "@/app/_lib/helpers";
import { getSupplier } from "@/app/_lib/data-service";
import PageHeader from "@/app/_components/layout/PageHeader";
import SupplierForm from "@/app/_components/admin/SupplierForm";

export const metadata = { title: "Edit Supplier" };

export default async function EditSupplierPage({ params }) {
  await requirePageRole(ROLES.ADMIN);
  const { id } = await params;
  const supplier = await getSupplier(id);
  if (!supplier) notFound();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Edit ${supplier.name}`}
        subtitle="Changes are recorded in the activity log."
        crumbs={[{ label: "Home", href: "/admin" }, { label: "Suppliers", href: "/admin/suppliers" }, { label: supplier.name, href: `/admin/suppliers/${id}` }, { label: "Edit" }]}
        actions={
          <Link href={`/admin/suppliers/${id}`} className="btn-secondary">
            <ArrowLeft size={17} aria-hidden /> Back to ledger
          </Link>
        }
      />
      <SupplierForm supplier={supplier} isAdmin afterSave={`/admin/suppliers/${id}`} />
    </div>
  );
}
