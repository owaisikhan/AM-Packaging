"use client";

import { useRouter, usePathname } from "next/navigation";
import { useRef } from "react";
import { Search } from "lucide-react";

// Filters as query-string links: the filtered view can be bookmarked or
// shared, and the back button undoes a filter. Selects apply at once;
// the search box applies on Enter.
export default function FilterBar({ search, selects = [], extra = null }) {
  const router = useRouter();
  const pathname = usePathname();
  const formRef = useRef(null);

  function apply() {
    const fd = new FormData(formRef.current);
    const sp = new URLSearchParams();
    for (const [k, v] of fd.entries()) {
      if (typeof v === "string" && v.trim()) sp.set(k, v.trim());
    }
    const qs = sp.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="card grid gap-3 p-4 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end"
    >
      {search ? (
        <div className="relative sm:col-span-2 lg:min-w-[260px] lg:flex-1">
          <label htmlFor={`f-${search.name}`} className="sr-only">
            {search.label}
          </label>
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input
            id={`f-${search.name}`}
            name={search.name}
            type="search"
            defaultValue={search.value}
            placeholder={search.placeholder}
            className="form-input pl-10"
          />
        </div>
      ) : null}
      {selects.map((s) => (
        <div key={s.name} className="lg:w-52">
          <label htmlFor={`f-${s.name}`} className="sr-only">
            {s.label}
          </label>
          {s.type === "date" ? (
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-wide text-muted" aria-hidden>
                {s.label}
              </span>
              <input
                id={`f-${s.name}`}
                name={s.name}
                type="date"
                defaultValue={s.value}
                onChange={apply}
                aria-label={s.label}
                className="form-input pl-14"
              />
            </div>
          ) : (
            <select id={`f-${s.name}`} name={s.name} defaultValue={s.value ?? ""} onChange={apply} className="form-select">
              <option value="">{s.allLabel}</option>
              {s.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
        </div>
      ))}
      {extra}
      <button type="submit" className="btn-secondary sm:col-span-2 lg:col-span-1">
        Apply
      </button>
    </form>
  );
}
