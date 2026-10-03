import Link from "next/link";
import { Boxes, CircleCheck, TriangleAlert, CircleX, Plus, SlidersHorizontal } from "lucide-react";
import { getLookups, getStockCounts, getStockPage, PAGE_SIZE } from "@/app/_lib/data-service";
import PageHeader from "@/app/_components/layout/PageHeader";
import StatCard from "@/app/_components/ui/StatCard";
import FilterBar from "@/app/_components/ui/FilterBar";
import ItemsTable from "./ItemsTable";

const COPY = {
  stock: { title: "Stock", subtitle: "What is in the factory right now, worked out from every purchase, production run and sale.", crumb: "Stock" },
  raw: { title: "Raw Materials", subtitle: "Jumbo rolls, paper tubes, cartons, shrink film and anything else that goes into production.", crumb: "Raw Materials" },
  finished: { title: "Products", subtitle: "Tape cartons, stretch film, plastic strip and any product type you add.", crumb: "Products" },
};

// One list page, three uses: Stock (all items), Raw Materials and Products.
export default async function ItemsListPage({ kind = "", searchParams, basePath, user }) {
  const sp = await searchParams;
  const isAdmin = user.role === "admin";
  const copy = COPY[kind || "stock"];
  const filterKind = kind || sp.kind || "";

  const [lookups, counts, list] = await Promise.all([
    getLookups(),
    getStockCounts(filterKind || undefined),
    getStockPage({ kind: filterKind, category: sp.category, status: sp.status, q: sp.q, page: sp.page, active: sp.show === "all" ? "all" : "active" }),
  ]);

  const categories = lookups.categories.filter((c) => !filterKind || c.kind === filterKind);
  const page = Math.max(1, Number(sp.page) || 1);

  const addHref = kind === "raw" ? "/admin/raw-materials/new" : kind === "finished" ? "/admin/products/new" : null;

  const actions = (
    <>
      {isAdmin && !kind ? (
        <Link href="/admin/stock/adjust" className="btn-secondary">
          <SlidersHorizontal size={17} aria-hidden /> Opening stock / Adjust
        </Link>
      ) : null}
      {isAdmin && addHref ? (
        <Link href={addHref} className="btn-primary">
          <Plus size={18} aria-hidden /> {kind === "raw" ? "Add Raw Material" : "Add Product"}
        </Link>
      ) : null}
    </>
  );

  const selects = [
    ...(kind
      ? []
      : [{ name: "kind", label: "Type", allLabel: "All types", value: sp.kind, options: [{ value: "raw", label: "Raw materials" }, { value: "finished", label: "Products" }] }]),
    { name: "category", label: "Category", allLabel: "All categories", value: sp.category, options: categories.map((c) => ({ value: c.id, label: c.name })) },
    { name: "status", label: "Stock status", allLabel: "All stock status", value: sp.status, options: [{ value: "in", label: "In stock" }, { value: "low", label: "Low stock" }, { value: "out", label: "Out of stock" }] },
    ...(isAdmin && kind
      ? [{ name: "show", label: "Show", allLabel: "Active items only", value: sp.show, options: [{ value: "all", label: "Include inactive" }] }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={copy.title}
        subtitle={copy.subtitle}
        crumbs={[{ label: "Home", href: "/admin" }, { label: copy.crumb }]}
        actions={actions}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard icon={Boxes} label="Total items" value={counts.total} tone="info" valueTone="plain" />
        <StatCard icon={CircleCheck} label="In stock" value={counts.in} tone="primary" />
        <StatCard icon={TriangleAlert} label="Low stock" value={counts.low} tone="warning" />
        <StatCard icon={CircleX} label="Out of stock" value={counts.out} tone="danger" />
      </div>

      <FilterBar
        search={{ name: "q", label: "Search", value: sp.q, placeholder: "Search by name, code or brand..." }}
        selects={selects}
      />

      <ItemsTable
        rows={list.rows}
        total={list.total}
        page={page}
        perPage={PAGE_SIZE}
        basePath={basePath}
        params={sp}
        mode={kind ? "manage" : "stock"}
        isAdmin={isAdmin}
        emptyAction={isAdmin && addHref ? <Link href={addHref} className="btn-primary"><Plus size={18} aria-hidden /> Add the first one</Link> : null}
      />
    </div>
  );
}
