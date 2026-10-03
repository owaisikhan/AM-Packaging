import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

// "Showing 1-20 of 145" and page buttons. Pages are links carrying the
// current filters, so the back button and shared links both work.
export default function Pagination({ page, perPage, total, basePath, params = {} }) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(Math.max(1, page), pages);
  const first = total === 0 ? 0 : (current - 1) * perPage + 1;
  const last = Math.min(current * perPage, total);

  const href = (p) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && k !== "page" && sp.set(k, v));
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  // A short window of page numbers around the current one
  const nums = [];
  for (let p = Math.max(1, current - 2); p <= Math.min(pages, current + 2); p += 1) nums.push(p);

  const btn = "flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-medium";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-4 sm:px-5">
      <p className="text-sm text-muted">
        Showing <span className="num font-medium text-text">{first}-{last}</span> of{" "}
        <span className="num font-medium text-text">{total}</span> entries
      </p>
      {pages > 1 ? (
        <nav className="flex items-center gap-2" aria-label="Pages">
          {current > 1 ? (
            <Link href={href(current - 1)} className={clsx(btn, "border-border bg-surface text-text hover:bg-background")} aria-label="Previous page">
              <ChevronLeft size={16} aria-hidden />
            </Link>
          ) : (
            <span className={clsx(btn, "border-border bg-surface text-muted opacity-50")} aria-hidden>
              <ChevronLeft size={16} />
            </span>
          )}
          {nums.map((p) => (
            <Link
              key={p}
              href={href(p)}
              aria-current={p === current ? "page" : undefined}
              className={clsx(
                btn,
                p === current ? "border-primary bg-primary text-white" : "border-border bg-surface text-text hover:bg-background",
              )}
            >
              {p}
            </Link>
          ))}
          {current < pages ? (
            <Link href={href(current + 1)} className={clsx(btn, "border-border bg-surface text-text hover:bg-background")} aria-label="Next page">
              <ChevronRight size={16} aria-hidden />
            </Link>
          ) : (
            <span className={clsx(btn, "border-border bg-surface text-muted opacity-50")} aria-hidden>
              <ChevronRight size={16} />
            </span>
          )}
        </nav>
      ) : null}
    </div>
  );
}
