import { Info } from "lucide-react";

export default function DemoBanner() {
  return (
    <div className="no-print mb-5 flex items-start gap-3 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1e40af] dark:border-[#1e3a5f] dark:bg-[#172554] dark:text-[#93c5fd]">
      <Info size={18} className="mt-px shrink-0" aria-hidden />
      <p>
        <span className="font-semibold">Demo mode.</span> No database is connected yet, so you are seeing sample data and
        nothing can be saved.
      </p>
    </div>
  );
}
