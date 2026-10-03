"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { signIn } from "@/app/_lib/actions";
import FormMessage from "@/app/_components/ui/FormMessage";
import SubmitButton from "@/app/_components/ui/SubmitButton";

export default function LoginForm({ next, demo }) {
  const [state, formAction] = useActionState(signIn, null);
  const [show, setShow] = useState(false);

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className="form-label">
          Email address
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required={!demo} placeholder="e.g. ali@ampackaging.pk" className="form-input" />
      </div>
      <div>
        <label htmlFor="password" className="form-label">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required={!demo}
            className="form-input pr-12"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:text-text"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
          </button>
        </div>
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary mt-1 h-12 w-full text-[15px]" pendingLabel="Signing in...">
        <LogIn size={18} aria-hidden /> Sign in
      </SubmitButton>
      {demo ? (
        <p className="rounded-xl border border-[#b7e4cc] bg-primary-light px-4 py-3 text-center text-sm text-primary-ink dark:border-[#1d5c3e]">
          Demo mode: no database is connected. Press Sign in to look around with sample data.
        </p>
      ) : null}
    </form>
  );
}
