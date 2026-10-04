import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePagePermission } from "@/app/_lib/helpers";
import { getItemOptions, getRecipesForProducts } from "@/app/_lib/data-service";
import { todayISO } from "@/app/_lib/date-helpers";
import PageHeader from "@/app/_components/layout/PageHeader";
import ProductionForm from "@/app/_components/admin/ProductionForm";

export const metadata = { title: "Record Production" };

export default async function NewProductionPage({ searchParams }) {
  const user = await requirePagePermission("production");
  const { product } = await searchParams;
  const [products, rawItems, recipes] = await Promise.all([getItemOptions("finished"), getItemOptions("raw"), getRecipesForProducts()]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Record Production"
        subtitle="What was made today and the raw materials it used. Fields marked * are required."
        crumbs={[{ label: "Home", href: "/admin" }, { label: "Production", href: "/admin/production" }, { label: "New" }]}
        actions={
          <Link href="/admin/production" className="btn-secondary">
            <ArrowLeft size={17} aria-hidden /> Back to Production
          </Link>
        }
      />
      <ProductionForm
        products={products}
        rawItems={rawItems}
        recipes={recipes}
        today={todayISO()}
        isAdmin={user.role === "admin"}
        initialProduct={products.some((p) => p.id === product) ? product : ""}
      />
    </div>
  );
}
