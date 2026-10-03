import { CircleCheck, CircleAlert } from "lucide-react";
import { withoutDashes } from "@/app/_lib/format-helpers";

// Renders the { ok, message } every Server Action returns.
export default function FormMessage({ state }) {
  if (!state?.message) return null;
  const ok = state.ok;
  return (
    <p
      role={ok ? "status" : "alert"}
      className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
        ok ? "bg-[#dcfce7] text-[#15803d] dark:bg-[#14532d] dark:text-[#4ade80]" : "bg-[#fee2e2] text-[#b91c1c] dark:bg-[#450a0a] dark:text-[#f87171]"
      }`}
    >
      {ok ? <CircleCheck size={18} className="mt-px shrink-0" aria-hidden /> : <CircleAlert size={18} className="mt-px shrink-0" aria-hidden />}
      <span>{withoutDashes(state.message)}</span>
    </p>
  );
}
