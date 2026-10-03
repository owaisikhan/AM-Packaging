import Link from "next/link";
import { History, Pencil, ShieldCheck, UserRound, Users } from "lucide-react";
import { requirePageRole, ROLES } from "@/app/_lib/helpers";
import { getProfiles } from "@/app/_lib/data-service";
import { formatDate } from "@/app/_lib/date-helpers";
import { initials } from "@/app/_lib/format-helpers";
import PageHeader from "@/app/_components/layout/PageHeader";
import StatCard from "@/app/_components/ui/StatCard";
import Badge from "@/app/_components/ui/Badge";
import UserForm from "@/app/_components/admin/UserForm";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  const me = await requirePageRole(ROLES.ADMIN);
  const profiles = await getProfiles();
  const active = profiles.filter((p) => p.active);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Users"
        subtitle="Who can sign in, and what they can do. Admins see everything; workers record production, purchases and sales."
        crumbs={[{ label: "Home", href: "/admin" }, { label: "Users" }]}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard icon={Users} label="Active users" value={active.length} tone="info" valueTone="plain" />
        <StatCard icon={ShieldCheck} label="Admins" value={active.filter((p) => p.role === "admin").length} tone="primary" />
        <StatCard icon={UserRound} label="Workers" value={active.filter((p) => p.role === "worker").length} tone="warning" valueTone="plain" />
      </div>

      <div className="grid gap-6 2xl:grid-cols-[1fr_380px]">
        <div className="card self-start overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="hidden xl:table-cell">Added</th>
                  <th scope="col" className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id} className={p.active ? "" : "opacity-60"}>
                    <td className="min-w-[200px]">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-bold text-primary">
                          {initials(p.full_name)}
                        </span>
                        <span className="font-semibold text-heading">
                          {p.full_name}
                          {p.id === me.id ? <span className="ml-1.5 text-xs font-medium text-muted">(you)</span> : null}
                        </span>
                      </div>
                    </td>
                    <td>
                      <Badge tone={p.role === "admin" ? "success" : "info"}>{p.role === "admin" ? "Admin" : "Worker"}</Badge>
                    </td>
                    <td>
                      <Badge tone={p.active ? "success" : "gray"}>{p.active ? "Can sign in" : "Switched off"}</Badge>
                    </td>
                    <td className="hidden whitespace-nowrap text-sm text-secondary xl:table-cell">{formatDate(p.created_at)}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/activity?user=${p.id}`} className="btn-secondary min-h-[38px] px-3 py-1.5 text-[13px]">
                          <History size={15} aria-hidden /> Activity
                        </Link>
                        <Link href={`/admin/users/${p.id}`} className="btn-secondary min-h-[38px] px-3 py-1.5 text-[13px]">
                          <Pencil size={14} aria-hidden /> Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card w-full max-w-2xl self-start p-5 sm:p-6 2xl:max-w-none">
          <h2 className="card-title border-b border-border pb-4">Add a user</h2>
          <UserForm />
        </div>
      </div>
    </div>
  );
}
