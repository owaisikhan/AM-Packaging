"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Package2 } from "lucide-react";
import { NAV_GROUPS } from "@/app/_components/admin/navItems";
import { initials } from "@/app/_lib/format-helpers";
import { closeMobileSidebar } from "./sidebarState";

// The fixed left sidebar. Collapsing to the 72px icon rail is a class on
// <html> (see sidebarState.js), so the same markup serves both widths and
// the CSS in globals.css does the rest.
export default function Sidebar({ user, appName, appTagline }) {
  const pathname = usePathname();
  const isAdmin = user.role === "admin";

  // A route change closes the phone drawer
  useEffect(() => {
    closeMobileSidebar();
  }, [pathname]);

  return (
    <>
      <aside className="app-sidebar no-print" aria-label="Main menu">
        <Link
          href="/admin"
          className="sidebar-brand flex h-16 shrink-0 items-center gap-3 border-b border-border px-4"
          aria-label={`${appName} home`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
            <Package2 size={22} strokeWidth={2} aria-hidden />
          </span>
          <span className="sidebar-label flex min-w-0 flex-col border-l border-border pl-3 leading-tight">
            <span className="text-[17px] font-bold text-heading">{appName}</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-primary">{appTagline}</span>
          </span>
        </Link>

        <nav className="sidebar-nav flex-1 overflow-y-auto overflow-x-hidden px-3 py-2">
          {NAV_GROUPS.filter((g) => isAdmin || !g.adminOnly).map((group) => (
            <div key={group.label}>
              <p className="sidebar-section-label">{group.label}</p>
              <ul className="flex flex-col gap-0.5">
                {group.items
                  .filter((item) => isAdmin || !item.adminOnly)
                  .map((item) => {
                    const active = item.exact
                      ? pathname === item.href
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="nav-item"
                          aria-current={active ? "page" : undefined}
                          onClick={closeMobileSidebar}
                        >
                          <Icon size={19} strokeWidth={1.8} className="shrink-0" aria-hidden />
                          <span className="sidebar-label">{item.label}</span>
                          <span className="nav-tooltip" aria-hidden>
                            {item.label}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="sidebar-user flex shrink-0 items-center gap-3 border-t border-border px-5 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
            {initials(user.full_name)}
          </span>
          <span className="sidebar-label flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold text-heading">{user.full_name}</span>
            <span className="text-xs text-muted">{isAdmin ? "Administrator" : "Worker"}</span>
          </span>
        </div>
      </aside>

      {/* Dimmed backdrop behind the phone drawer; tapping it closes the menu */}
      <button
        type="button"
        aria-label="Close menu"
        tabIndex={-1}
        onClick={closeMobileSidebar}
        className="sidebar-overlay fixed inset-0 z-50 hidden bg-black/40 lg:hidden"
      />
    </>
  );
}
