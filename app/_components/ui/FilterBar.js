"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { useTrackPending } from "@/app/_components/layout/NavigationProgress";
import Spinner from "./Spinner";

const SEARCH_DELAY_MS = 300;

// Filters as query-string links: the filtered view can be bookmarked or
// shared. The search box filters as you type (after a short pause), selects
// and dates apply the moment they change. replace(), not push(), so typing
// does not fill the back button with one entry per letter.
export default function FilterBar({ search, selects = [], extra = null }) {
  const router = useRouter();
  const pathname = usePathname();
  const formRef = useRef(null);
  const timer = useRef(null);
  const [isPending, startTransition] = useTransition();
  const [hasFilters, setHasFilters] = useState(
    () => Boolean(search?.value) || selects.some((s) => Boolean(s.value)),
  );

  // The top loading bar shows while results load; the page is not dimmed,
  // because the person is still typing into it.
  useTrackPending(isPending, { dim: false });

  useEffect(() => () => clearTimeout(timer.current), []);

  // If the search changes from outside (the header search box, the back
  // button), show it here too, unless this box is the one being typed in.
  const searchInput = useRef(null);
  useEffect(() => {
    const el = searchInput.current;
    if (el && document.activeElement !== el) el.value = search?.value ?? "";
  }, [search?.value]);

  function apply() {
    clearTimeout(timer.current);
    const fd = new FormData(formRef.current);
    const sp = new URLSearchParams();
    for (const [k, v] of fd.entries()) {
      if (typeof v === "string" && v.trim()) sp.set(k, v.trim());
    }
    // Any change of filter starts again from the first page
    sp.delete("page");
    setHasFilters(sp.toString() !== "");
    const qs = sp.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  function applySoon() {
    clearTimeout(timer.current);
    timer.current = setTimeout(apply, SEARCH_DELAY_MS);
  }

  function clearAll() {
    for (const el of formRef.current.elements) {
      if (el.name && (el.tagName === "INPUT" || el.tagName === "SELECT")) el.value = "";
    }
    apply();
  }

  return (
    <form
      ref={formRef}
      role="search"
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
          <span className="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 text-muted" aria-hidden>
            {isPending ? <Spinner /> : <Search size={17} />}
          </span>
          <input
            id={`f-${search.name}`}
            name={search.name}
            type="search"
            defaultValue={search.value}
            placeholder={search.placeholder}
            ref={searchInput}
            onChange={applySoon}
            autoComplete="off"
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
      {hasFilters ? (
        <button type="button" onClick={clearAll} className="btn-secondary sm:col-span-2 lg:col-span-1">
          <X size={16} aria-hidden /> Clear filters
        </button>
      ) : null}
    </form>
  );
}
