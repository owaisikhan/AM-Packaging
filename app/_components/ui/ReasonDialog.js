"use client";

import { useActionState, useEffect, useRef } from "react";
import { X, TriangleAlert } from "lucide-react";
import FormMessage from "./FormMessage";
import SubmitButton from "./SubmitButton";

// A confirm dialog that asks for a written reason, for voiding a bill,
// a run or a payment. The consequence is spelled out in `warning`.
export default function ReasonDialog({ action, id, triggerLabel, icon = null, title, warning, confirmLabel, triggerClassName = "btn-danger" }) {
  const ref = useRef(null);
  const [state, formAction] = useActionState(action, null);

  useEffect(() => {
    if (state?.ok) ref.current?.close();
  }, [state]);

  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className={triggerClassName}>
        {icon} {triggerLabel}
      </button>
      {state?.ok ? <FormMessage state={state} /> : null}
      <dialog
        ref={ref}
        onClick={(e) => e.target === ref.current && ref.current.close()}
        className="m-auto w-[min(520px,calc(100vw-24px))] rounded-[20px] border border-border bg-surface p-0 text-text shadow-lg backdrop:bg-black/50"
      >
        <form action={formAction}>
          <input type="hidden" name="id" value={id} />
          <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fee2e2] text-danger dark:bg-[#450a0a]">
                <TriangleAlert size={19} aria-hidden />
              </span>
              <div>
                <h2 className="text-lg font-bold text-heading">{title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">{warning}</p>
              </div>
            </div>
            <button type="button" onClick={() => ref.current?.close()} className="btn-ghost" aria-label="Close">
              <X size={18} aria-hidden />
            </button>
          </div>
          <div className="flex flex-col gap-3 px-6 py-5">
            <label htmlFor={`reason-${id}`} className="form-label">
              Reason<span className="ml-0.5 text-danger">*</span>
            </label>
            <textarea id={`reason-${id}`} name="reason" required rows={3} placeholder="e.g. Entered twice by mistake" className="form-input min-h-[90px] resize-y" />
            {state && !state.ok ? <FormMessage state={state} /> : null}
          </div>
          <div className="flex flex-wrap justify-end gap-3 border-t border-border px-6 py-4">
            <button type="button" onClick={() => ref.current?.close()} className="btn-secondary">
              Keep it
            </button>
            <SubmitButton className="btn-danger" pendingLabel="Voiding...">
              {confirmLabel}
            </SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
