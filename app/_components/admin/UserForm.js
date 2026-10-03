"use client";

import { useActionState, useEffect, useRef } from "react";
import { Save, UserPlus } from "lucide-react";
import { createUser, updateUser } from "@/app/_lib/actions";
import FormMessage from "@/app/_components/ui/FormMessage";
import SubmitButton from "@/app/_components/ui/SubmitButton";

export default function UserForm({ profile = null, isSelf = false }) {
  const [state, formAction] = useActionState(profile ? updateUser : createUser, null);
  const formRef = useRef(null);

  useEffect(() => {
    if (state?.ok && !profile) formRef.current?.reset();
  }, [state, profile]);

  return (
    <form ref={formRef} action={formAction} className="mt-5 flex flex-col gap-4">
      {profile ? <input type="hidden" name="id" value={profile.id} /> : null}
      <div>
        <label htmlFor="full_name" className="form-label">
          Full name<span className="ml-0.5 text-danger">*</span>
        </label>
        <input id="full_name" name="full_name" defaultValue={profile?.full_name} required placeholder="e.g. Ali Raza" className="form-input" />
      </div>
      {profile ? null : (
        <div>
          <label htmlFor="email" className="form-label">
            Email (they sign in with this)<span className="ml-0.5 text-danger">*</span>
          </label>
          <input id="email" name="email" type="email" required placeholder="e.g. ali@ampackaging.pk" className="form-input" />
        </div>
      )}
      <div>
        <label htmlFor="password" className="form-label">
          {profile ? "New password (leave empty to keep the current one)" : "Password"}
          {profile ? null : <span className="ml-0.5 text-danger">*</span>}
        </label>
        <input id="password" name="password" type="text" autoComplete="new-password" minLength={8} required={!profile} placeholder="At least 8 characters" className="form-input" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="role" className="form-label">Role</label>
          <select id="role" name="role" defaultValue={profile?.role ?? "worker"} disabled={isSelf} className="form-select">
            <option value="worker">Worker</option>
            <option value="admin">Admin</option>
          </select>
          {isSelf ? <input type="hidden" name="role" value={profile.role} /> : null}
        </div>
        {profile ? (
          <div>
            <label htmlFor="active" className="form-label">Sign-in</label>
            <select id="active" name="active" defaultValue={profile.active ? "true" : "false"} disabled={isSelf} className="form-select">
              <option value="true">Can sign in</option>
              <option value="false">Switched off</option>
            </select>
            {isSelf ? <input type="hidden" name="active" value="true" /> : null}
          </div>
        ) : null}
      </div>
      <p className="rounded-xl bg-background px-4 py-3 text-xs leading-relaxed text-muted">
        Workers record production, purchases and sales and see stock. Only admins see reports, activity, users and settings,
        and only admins can correct or void past entries.
      </p>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary h-12 w-full text-[15px]" pendingLabel={profile ? "Saving..." : "Adding..."}>
        {profile ? <Save size={18} aria-hidden /> : <UserPlus size={18} aria-hidden />} {profile ? "Save changes" : "Add user"}
      </SubmitButton>
    </form>
  );
}
