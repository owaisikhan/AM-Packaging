import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePageRole } from "@/app/_lib/helpers";
import PageHeader from "@/app/_components/layout/PageHeader";
import SupplierForm from "@/app/_components/admin/SupplierForm";

export const metadata = { title: "Add Supplier" };

export default async function NewSupplierPage() {
  const user = await requirePageRole();
  const isAdmin = user.role === "admin";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Add Supplier"
        subtitle="Fields marked * are required."
        crumbs={[{ label: "Home", href: "/admin" }, { label: "Suppliers", href: "/admin/suppliers" }, { label: "Add" }]}
        actions={
          <Link href="/admin/suppliers" className="btn-secondary">
            <ArrowLeft size={17} aria-hidden /> Back to Suppliers
          </Link>
        }
      />
      <SupplierForm isAdmin={isAdmin} afterSave={isAdmin ? "/admin/suppliers/:id" : "/admin/suppliers"} />
    </div>
  );
}
