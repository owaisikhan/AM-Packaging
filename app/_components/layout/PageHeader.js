import Link from "next/link";
import { ChevronRight } from "lucide-react";

// The white header card at the top of every page: breadcrumb, title,
// subtitle and the page's main actions on the right (reference design).
export default function PageHeader({ title, subtitle, crumbs = [], actions = null, badge = null }) {
  return (
    <div className="page-header">
      <div className="min-w-0">
        {crumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-muted">
            {crumbs.map((c, i) => (
              <span key={c.label} className="flex items-center gap-1">
                {i > 0 ? <ChevronRight size={12} aria-hidden /> : null}
                {c.href ? (
                  <Link href={c.href} className="hover:text-primary">
                    {c.label}
                  </Link>
                ) : (
                  <span className="font-semibold text-heading">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="page-title">{title}</h1>
          {badge}
        </div>
        {subtitle ? <p className="mt-1 text-[13px] leading-relaxed text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
    </div>
  );
}
