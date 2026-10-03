"use client";

import { useActionState } from "react";
import { EyeOff, Eye } from "lucide-react";
import { setItemActive } from "@/app/_lib/actions";
import FormMessage from "@/app/_components/ui/FormMessage";
import SubmitButton from "@/app/_components/ui/SubmitButton";

// Items are never deleted (their history would be lost); they are switched
// off so they leave the pick lists.
export default function ActiveToggle({ id, active, name }) {
  const [state, formAction] = useActionState(setItemActive, null);
  return (
    <form action={formAction} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="active" value={active ? "false" : "true"} />
      <div>
        <p className="font-semibold text-heading">{active ? "Stop using this item" : "Use this item again"}</p>
        <p className="mt-1 text-sm text-muted">
          {active
            ? `Hides ${name} from pick lists on new bills and runs. Its stock history stays.`
            : `Puts ${name} back in the pick lists.`}
        </p>
        <div className="mt-3">
          <FormMessage state={state} />
        </div>
      </div>
      <SubmitButton className={active ? "btn-secondary" : "btn-primary"} pendingLabel="Updating...">
        {active ? <EyeOff size={17} aria-hidden /> : <Eye size={17} aria-hidden />} {active ? "Mark inactive" : "Mark active"}
      </SubmitButton>
    </form>
  );
}
