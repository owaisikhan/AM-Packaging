"use client";

import { useRef, useState } from "react";
import { UserPlus, X } from "lucide-react";
import UserForm from "./UserForm";
import FormMessage from "@/app/_components/ui/FormMessage";

// "Add user" button on the Users page. The form opens in a dialog and closes
// itself once the account is made, leaving the confirmation on the page.
export default function AddUserDialog() {
  const ref = useRef(null);
  const [done, setDone] = useState(null);
  const [formKey, setFormKey] = useState(0);

  function open() {
    setDone(null);
    setFormKey((k) => k + 1); // a fresh, empty form each time
    ref.current?.showModal();
  }

  return (
    <>
      <button type="button" onClick={open} className="btn-primary">
        <UserPlus size={18} aria-hidden /> Add user
      </button>
      {done ? (
        <div className="basis-full">
          <FormMessage state={done} />
        </div>
      ) : null}
      <dialog
        ref={ref}
        aria-labelledby="add-user-title"
        onClick={(e) => e.target === ref.current && ref.current.close()}
        className="m-auto max-h-[calc(100dvh-24px)] w-[min(560px,calc(100vw-24px))] overflow-y-auto rounded-[20px] border border-border bg-surface p-0 text-text shadow-lg backdrop:bg-black/50"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-surface px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-ink">
              <UserPlus size={19} aria-hidden />
            </span>
            <div>
              <h2 id="add-user-title" className="text-lg font-bold text-heading">
                Add a user
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">They sign in with this email and password.</p>
            </div>
          </div>
          <button type="button" onClick={() => ref.current?.close()} className="btn-ghost" aria-label="Close">
            <X size={18} aria-hidden />
          </button>
        </div>
        <div className="px-6 pb-6">
          <UserForm
            key={formKey}
            onDone={(state) => {
              setDone(state);
              ref.current?.close();
            }}
          />
        </div>
      </dialog>
    </>
  );
}
