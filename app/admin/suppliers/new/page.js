import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePageRole } from "@/app/_lib/helpers";
import PageHeader from "@/app/_components/layout/PageHeader";
import SupplierForm from "@/app/_components/admin/SupplierForm";

export const metadata = { title: "Add Supplier" };

export default async function NewSupplierPage({ searchParams }) {
  const user = await requirePageRole();
  // Opened from a new purchase form: save, then go straight back to it with this one picked.
  const fromForm = (await searchParams).from === "purchase";
  const isAdmin = user.role === "admin";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Add Supplier"
        subtitle={fromForm ? "Fields marked * are required. Saving takes you back to the purchase with this supplier picked." : "Fields marked * are required."}
        crumbs={[{ label: "Home", href: "/admin" }, { label: "Suppliers", href: "/admin/suppliers" }, { label: "Add" }]}
        actions={
          <Link href={fromForm ? "/admin/purchases/new" : "/admin/suppliers"} className="btn-secondary">
            <ArrowLeft size={17} aria-hidden /> {fromForm ? "Back to New Purchase" : "Back to Suppliers"}
          </Link>
        }
      />
      <SupplierForm isAdmin={isAdmin} afterSave={fromForm ? "/admin/purchases/new?supplier=:id" : isAdmin ? "/admin/suppliers/:id" : "/admin/suppliers"} />
    </div>
  );
}
