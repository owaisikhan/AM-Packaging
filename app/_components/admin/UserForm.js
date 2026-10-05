"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Save, ShieldCheck, UserPlus, Wallet, Wrench } from "lucide-react";
import { createUser, updateUser } from "@/app/_lib/actions";
import { DEFAULT_PERMISSIONS, PERMISSIONS } from "@/app/_lib/permissions";
import FormMessage from "@/app/_components/ui/FormMessage";
import SubmitButton from "@/app/_components/ui/SubmitButton";

// layout="wide" (the Add user window): account details on the left and the
// permission boxes on the right on laptop screens, so nothing scrolls.
// The default stacks everything in one column.
export default function UserForm({
  profile = null,
  isSelf = false,
  onDone = null,
  layout = "stacked",
}) {
  const wide = layout === "wide";
  const [state, formAction] = useActionState(
    profile ? updateUser : createUser,
    null,
  );
  const formRef = useRef(null);
  const [role, setRole] = useState(profile?.role ?? "worker");
  const startPerms = profile?.permissions ?? DEFAULT_PERMISSIONS;

  useEffect(() => {
    if (state?.ok && !profile) {
      formRef.current?.reset();
      onDone?.(state);
    }
  }, [state, profile, onDone]);

  return (
    <form
      ref={formRef}
      action={formAction}
      onReset={() => setRole("worker")}
      className={`mt-5 flex flex-col gap-4 ${wide ? "lg:mt-4 lg:grid lg:grid-cols-[230px_minmax(0,1fr)] xl:grid-cols-[270px_minmax(0,1fr)] lg:items-start lg:gap-x-6" : ""}`}
    >
      {profile ? <input type="hidden" name="id" value={profile.id} /> : null}
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="full_name" className="form-label">
            Full name<span className="ml-0.5 text-danger-ink">*</span>
          </label>
          <input
            id="full_name"
            name="full_name"
            defaultValue={profile?.full_name}
            required
            placeholder="e.g. Ali Raza"
            className="form-input"
          />
        </div>
        {profile ? null : (
          <div>
            <label htmlFor="email" className="form-label">
              Email (they sign in with this)
              <span className="ml-0.5 text-danger-ink">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="e.g. ali@ampackaging.pk"
              className="form-input"
            />
          </div>
        )}
        <div>
          <label htmlFor="password" className="form-label">
            {profile
              ? "New password (leave empty to keep the current one)"
              : "Password"}
            {profile ? null : <span className="ml-0.5 text-danger-ink">*</span>}
          </label>
          <input
            id="password"
            name="password"
            type="text"
            autoComplete="new-password"
            minLength={8}
            required={!profile}
            placeholder="At least 8 characters"
            className="form-input"
          />
        </div>
        <div
          className={`grid gap-4 sm:grid-cols-2 ${wide ? "lg:grid-cols-1" : ""}`}
        >
          <div>
            <label htmlFor="role" className="form-label">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isSelf}
              className="form-select"
            >
              <option value="worker">Worker</option>
              <option value="admin">Admin</option>
            </select>
            {isSelf ? (
              <input type="hidden" name="role" value={profile.role} />
            ) : null}
          </div>
          {profile ? (
            <div>
              <label htmlFor="active" className="form-label">
                Sign-in
              </label>
              <select
                id="active"
                name="active"
                defaultValue={profile.active ? "true" : "false"}
                disabled={isSelf}
                className="form-select"
              >
                <option value="true">Can sign in</option>
                <option value="false">Switched off</option>
              </select>
              {isSelf ? (
                <input type="hidden" name="active" value="true" />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      {role === "worker" ? (
        <fieldset className={`rounded-xl border border-border p-4 ${wide ? "lg:px-4 lg:py-2" : ""}`}>
          <legend className="px-1 text-sm font-bold text-heading">
            What this worker can do
          </legend>
          <div className={wide ? "lg:grid lg:grid-cols-2 lg:gap-5" : ""}>
            <PermissionGroup
              icon={Wrench}
              title="Daily work"
              perms={PERMISSIONS.filter((p) => p.group === "work")}
              start={startPerms}
            />
            <PermissionGroup
              icon={Wallet}
              title="Money (off unless you trust them)"
              perms={PERMISSIONS.filter((p) => p.group === "money")}
              start={startPerms}
            />
          </div>
          <PermissionNote className={wide ? "mt-3 lg:hidden" : "mt-3"} />
        </fieldset>
      ) : (
        <p className="flex items-start gap-2 rounded-xl bg-background px-4 py-3 text-xs leading-relaxed text-muted">
          <ShieldCheck size={15} className="mt-0.5 shrink-0" aria-hidden />
          Admins can do everything, including users, settings and the activity
          log.
        </p>
      )}
      <div
        className={`flex flex-col gap-4 ${wide ? "lg:col-span-2 lg:flex-row lg:items-center lg:justify-end" : ""}`}
      >
        <div className={wide ? "lg:flex-1" : ""}>
          <FormMessage state={state} />
          {wide && role === "worker" && !state ? <PermissionNote className="hidden lg:block" /> : null}
        </div>
        <SubmitButton
          className={`btn-primary h-12 w-full text-[15px] ${wide ? "lg:w-auto lg:px-8" : ""}`}
          pendingLabel={profile ? "Saving..." : "Adding..."}
        >
          {profile ? (
            <Save size={18} aria-hidden />
          ) : (
            <UserPlus size={18} aria-hidden />
          )}{" "}
          {profile ? "Save changes" : "Add user"}
        </SubmitButton>
      </div>
    </form>
  );
}

// One group of permission tick boxes. Plain checkboxes, so the form posts
// every ticked key as "permissions".
function PermissionGroup({ icon: Icon, title, perms, start }) {
  return (
    <div className="mt-2 lg:mt-0">
      <p className="mb-1 mt-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.06em] text-muted lg:mt-1">
        <Icon size={14} aria-hidden /> {title}
      </p>
      <ul className="flex flex-col">
        {perms.map((p) => (
          <li key={p.key}>
            <label className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-background lg:py-1.5">
              <input
                type="checkbox"
                name="permissions"
                value={p.key}
                defaultChecked={start.includes(p.key)}
                className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[var(--color-primary)]"
              />
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold text-heading">
                  {p.label}
                </span>
                <span className="block text-xs leading-relaxed text-muted">
                  {p.hint}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PermissionNote({ className = "" }) {
  return (
    <p className={`text-xs leading-relaxed text-muted ${className}`}>
      You can change these later with Edit. Settings, items, recipes, stock corrections, users and the activity log are always for
      admins only.
    </p>
  );
}
