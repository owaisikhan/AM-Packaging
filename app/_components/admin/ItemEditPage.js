import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, History } from "lucide-react";
import { getItem, getLookups } from "@/app/_lib/data-service";
import { requirePageRole, ROLES } from "@/app/_lib/helpers";
import PageHeader from "@/app/_components/layout/PageHeader";
import ItemForm from "./ItemForm";
import ActiveToggle from "./ActiveToggle";
import Badge from "@/app/_components/ui/Badge";

// New and edit pages for raw materials and products (admin only).
export default async function ItemEditPage({ kind, id }) {
  await requirePageRole(ROLES.ADMIN);
  const listHref = kind === "raw" ? "/admin/raw-materials" : "/admin/products";
  const listLabel = kind === "raw" ? "Raw Materials" : "Products";

  const [lookups, item] = await Promise.all([getLookups(), id ? getItem(id) : null]);
  if (id && (!item || item.kind !== kind)) notFound();

  const title = item ? item.name : kind === "raw" ? "Add Raw Material" : "Add Product";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={title}
        subtitle={item ? `${item.category_name} · counted in ${item.unit}` : "Fields marked * are required."}
        crumbs={[{ label: "Home", href: "/admin" }, { label: listLabel, href: listHref }, { label: item ? "Edit" : "Add" }]}
        badge={item && !item.active ? <Badge tone="gray">Inactive</Badge> : null}
        actions={
          <>
            {item ? (
              <Link href={`/admin/stock/${item.id}`} className="btn-secondary">
                <History size={17} aria-hidden /> Stock history
              </Link>
            ) : null}
            <Link href={listHref} className="btn-secondary">
              <ArrowLeft size={17} aria-hidden /> Back to {listLabel}
            </Link>
          </>
        }
      />
      <ItemForm kind={kind} item={item} lookups={lookups} listHref={listHref} />
      {item ? <ActiveToggle id={item.id} active={item.active} name={item.name} /> : null}
    </div>
  );
}
