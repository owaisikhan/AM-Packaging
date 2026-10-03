import { Activity, CirclePlus, Pencil, Trash2, Download, History } from "lucide-react";
import { requirePageRole, ROLES } from "@/app/_lib/helpers";
import { getActivityCounts, getActivityPage, getProfiles, PAGE_SIZE } from "@/app/_lib/data-service";
import PageHeader from "@/app/_components/layout/PageHeader";
import StatCard from "@/app/_components/ui/StatCard";
import FilterBar from "@/app/_components/ui/FilterBar";
import Pagination from "@/app/_components/ui/Pagination";
import EmptyState from "@/app/_components/ui/EmptyState";
import ActivityTable from "@/app/_components/admin/ActivityTable";
import { ACTIONS, MODULES } from "@/app/_components/admin/ActivityLabels";

export const metadata = { title: "Activity" };

export default async function ActivityPage({ searchParams }) {
  await requirePageRole(ROLES.ADMIN);
  const sp = await searchParams;
  const filters = { user: sp.user, module: sp.module, action: sp.action, from: sp.from, to: sp.to, q: sp.q, page: sp.page };

  const [profiles, counts, list] = await Promise.all([getProfiles(), getActivityCounts(sp.user), getActivityPage(filters)]);
  const who = profiles.find((p) => p.id === sp.user);

  const exportQs = new URLSearchParams(Object.entries(filters).filter(([k, v]) => v && k !== "page")).toString();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Activity"
        subtitle={
          who
            ? `Everything ${who.full_name} has done in the app, newest first.`
            : "Every action performed in the app: who did it, when, and what changed. Entries cannot be edited or deleted."
        }
        crumbs={[{ label: "Home", href: "/admin" }, { label: "Activity" }]}
        actions={
          <a href={`/admin/activity/export${exportQs ? `?${exportQs}` : ""}`} className="btn-secondary">
            <Download size={17} aria-hidden /> Export CSV
          </a>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard icon={Activity} label="Today's actions" value={counts.today} tone="info" valueTone="plain" />
        <StatCard icon={CirclePlus} label="Creates" value={counts.created} tone="primary" />
        <StatCard icon={Pencil} label="Updates & stock entries" value={counts.updated} tone="warning" />
        <StatCard icon={Trash2} label="Deletes & voids" value={counts.deleted} tone="danger" />
      </div>

      <FilterBar
        search={{ name: "q", label: "Search", value: sp.q, placeholder: "Search what happened, e.g. INV-00012 or a customer..." }}
        selects={[
          { name: "user", label: "User", allLabel: "All users", value: sp.user, options: profiles.map((p) => ({ value: p.id, label: `${p.full_name} (${p.role === "admin" ? "Admin" : "Worker"})` })) },
          { name: "module", label: "Module", allLabel: "All modules", value: sp.module, options: Object.entries(MODULES).map(([value, label]) => ({ value, label })) },
          { name: "action", label: "Action", allLabel: "All actions", value: sp.action, options: Object.entries(ACTIONS).map(([value, a]) => ({ value, label: a.label })) },
          { name: "from", label: "From", type: "date", value: sp.from },
          { name: "to", label: "To", type: "date", value: sp.to },
        ]}
      />

      <div className="card overflow-hidden">
        {list.rows.length === 0 ? (
          <EmptyState icon={History} title="No activity found">
            Nothing matches these filters. Pick another user or widen the dates.
          </EmptyState>
        ) : (
          <>
            <ActivityTable rows={list.rows} />
            <Pagination page={Math.max(1, Number(sp.page) || 1)} perPage={PAGE_SIZE} total={list.total} basePath="/admin/activity" params={sp} />
          </>
        )}
      </div>
    </div>
  );
}
