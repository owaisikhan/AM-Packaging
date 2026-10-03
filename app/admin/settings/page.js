import Link from "next/link";
import { requirePageRole, ROLES } from "@/app/_lib/helpers";
import { getItemOptions, getLookups, getRecipe, getSettings } from "@/app/_lib/data-service";
import PageHeader from "@/app/_components/layout/PageHeader";
import CompanySettingsForm from "@/app/_components/admin/CompanySettingsForm";
import LookupManager from "@/app/_components/admin/LookupManager";
import RecipeEditor from "@/app/_components/admin/RecipeEditor";

export const metadata = { title: "Settings" };

const TABS = [
  { key: "company", label: "Company & Invoice" },
  { key: "categories", label: "Categories", table: "item_categories", lookup: "categories" },
  { key: "brands", label: "Brands", table: "brands", lookup: "brands" },
  { key: "sizes", label: "Sizes", table: "sizes", lookup: "sizes" },
  { key: "microns", label: "Microns", table: "microns", lookup: "microns" },
  { key: "colors", label: "Colors / Types", table: "colors", lookup: "colors" },
  { key: "units", label: "Units", table: "units", lookup: "units" },
  { key: "recipes", label: "Recipes" },
];

export default async function SettingsPage({ searchParams }) {
  await requirePageRole(ROLES.ADMIN);
  const sp = await searchParams;
  const tab = TABS.find((t) => t.key === sp.tab) ?? TABS[0];

  let body;
  if (tab.key === "company") {
    body = <CompanySettingsForm settings={await getSettings()} />;
  } else if (tab.key === "recipes") {
    const [products, rawItems, recipe] = await Promise.all([
      getItemOptions("finished"),
      getItemOptions("raw"),
      sp.product ? getRecipe(sp.product) : null,
    ]);
    body = <RecipeEditor key={sp.product ?? "none"} products={products} rawItems={rawItems} productId={sp.product} recipe={recipe} />;
  } else {
    const lookups = await getLookups();
    body = <LookupManager table={tab.table} rows={lookups[tab.lookup]} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        subtitle="Company details for invoices, and the lists used across the app. Changes are recorded in the activity log."
        crumbs={[{ label: "Home", href: "/admin" }, { label: "Settings" }]}
        actions={
          <Link href="/admin/users" className="btn-secondary">
            Manage users
          </Link>
        }
      />
      <nav aria-label="Settings sections" className="card px-2">
        <ul className="flex flex-wrap">
          {TABS.map((t) => (
            <li key={t.key}>
              <Link
                href={`/admin/settings?tab=${t.key}`}
                aria-current={t.key === tab.key ? "page" : undefined}
                className={`-mb-px flex min-h-[48px] items-center border-b-2 px-4 text-sm font-medium transition-colors ${
                  t.key === tab.key ? "border-primary font-semibold text-primary-ink" : "border-transparent text-muted hover:text-text"
                }`}
              >
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {body}
    </div>
  );
}
