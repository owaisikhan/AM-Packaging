import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, History } from "lucide-react";
import { requirePageRole, ROLES } from "@/app/_lib/helpers";
import { getProfiles } from "@/app/_lib/data-service";
import PageHeader from "@/app/_components/layout/PageHeader";
import UserForm from "@/app/_components/admin/UserForm";

export const metadata = { title: "Edit user" };

export default async function EditUserPage({ params }) {
  const me = await requirePageRole(ROLES.ADMIN);
  const { id } = await params;
  const profile = (await getProfiles()).find((p) => p.id === id);
  if (!profile) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={profile.full_name}
        subtitle="Change their name, role or password, or switch their sign-in off."
        crumbs={[{ label: "Home", href: "/admin" }, { label: "Users", href: "/admin/users" }, { label: "Edit" }]}
        actions={
          <>
            <Link href={`/admin/activity?user=${profile.id}`} className="btn-secondary">
              <History size={17} aria-hidden /> Their activity
            </Link>
            <Link href="/admin/users" className="btn-secondary">
              <ArrowLeft size={17} aria-hidden /> Back to Users
            </Link>
          </>
        }
      />
      <div className="card max-w-2xl p-5 sm:p-6">
        <UserForm profile={profile} isSelf={profile.id === me.id} />
      </div>
    </div>
  );
}
