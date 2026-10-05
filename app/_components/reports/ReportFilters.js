"use client";

import { useRef, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTrackPending } from "@/app/_components/layout/NavigationProgress";

/**
 * One row of filters above every chart on the tab: the date range first
 * (presets, or two dates), then how to group. Applies the moment it changes.
 */
export default function ReportFilters({ tab, presets, range, showGroup = true }) {
  const router = useRouter();
  const pathname = usePathname();
  const formRef = useRef(null);
  const [isPending, startTransition] = useTransition();
  useTrackPending(isPending);

  function apply(changed) {
    const fd = new FormData(formRef.current);
    const sp = new URLSearchParams({ tab });
    const preset = fd.get("range");
    if (preset && preset !== "30d") sp.set("range", preset);
    if (preset === "custom") {
      // The date boxes only appear once the range is custom, so the first
      // pick starts from the dates already on show.
      for (const k of ["from", "to"]) sp.set(k, fd.get(k) || range[k]);
    }
    // A new range picks its own grouping unless one was chosen on purpose
    const group = fd.get("group");
    if (group && group !== "auto" && changed !== "range") sp.set("group", group);
    startTransition(() => router.replace(`${pathname}?${sp}`, { scroll: false }));
  }

  return (
    <form ref={formRef} onSubmit={(e) => e.preventDefault()} className="card grid gap-3 p-4 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end">
      <div className="lg:w-56">
        <label htmlFor="r-range" className="form-label">Period</label>
        <select key={range.preset} id="r-range" name="range" defaultValue={range.preset} onChange={() => apply("range")} className="form-select">
          {presets.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>
      {range.preset === "custom" ? (
        <>
          <div className="lg:w-48">
            <label htmlFor="r-from" className="form-label">From</label>
            <input id="r-from" name="from" type="date" defaultValue={range.from} onChange={() => apply("dates")} className="form-input" />
          </div>
          <div className="lg:w-48">
            <label htmlFor="r-to" className="form-label">To</label>
            <input id="r-to" name="to" type="date" defaultValue={range.to} onChange={() => apply("dates")} className="form-input" />
          </div>
        </>
      ) : null}
      {showGroup ? (
        <div className="lg:w-48">
          <label htmlFor="r-group" className="form-label">Group by</label>
          <select id="r-group" name="group" defaultValue={range.groupChosen ? range.grain : "auto"} onChange={() => apply("group")} className="form-select">
            <option value="auto">Best fit ({range.grain})</option>
            {range.days <= 400 ? <option value="day">Day</option> : null}
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>
      ) : null}
      <p className="text-sm text-secondary sm:col-span-2 lg:mb-2.5 lg:ml-auto">
        Showing <span className="font-semibold text-heading">{range.label}</span>
      </p>
    </form>
  );
}
