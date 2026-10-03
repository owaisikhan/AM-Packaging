"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bell, ChevronDown, LogOut, Menu, Moon, Search, Sun } from "lucide-react";
import { initials, formatQtyUnit } from "@/app/_lib/format-helpers";
import { signOut } from "@/app/_lib/actions";
import { toggleSidebar } from "./sidebarState";
import { THEME_KEY } from "./themeState";
import { useTrackPending } from "./NavigationProgress";

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target)) onOutside();
    };
    const onKey = (event) => event.key === "Escape" && onOutside();
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, onOutside]);
}

export default function Header({ user, alerts, alertCount }) {
  const [menu, setMenu] = useState(null); // "alerts" | "user" | null
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchTimer = useRef(null);
  const [searching, startSearch] = useTransition();
  useTrackPending(searching, { dim: false });

  // Typing in the header searches stock as you go. On the Stock page it
  // replaces the URL (no history entry per letter); from any other page the
  // first search moves you to Stock. The header stays mounted, so the box
  // keeps focus.
  function searchStock(value, now = false) {
    clearTimeout(searchTimer.current);
    const q = value.trim();
    const onStock = pathname === "/admin/stock";
    if (!q && !onStock && !now) return;
    const url = q ? `/admin/stock?q=${encodeURIComponent(q)}` : "/admin/stock";
    startSearch(() => {
      if (onStock) router.replace(url, { scroll: false });
      else router.push(url);
    });
  }
  const alertsRef = useRef(null);
  const userRef = useRef(null);

  useClickOutside(alertsRef, () => setMenu((m) => (m === "alerts" ? null : m)));
  useClickOutside(userRef, () => setMenu((m) => (m === "user" ? null : m)));

  function toggleTheme() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      // Storage blocked: the theme still changes for this visit.
    }
  }

  return (
    <header className="app-header no-print">
      <button type="button" onClick={toggleSidebar} className="btn-ghost" aria-label="Show or hide the menu">
        <Menu size={20} aria-hidden />
      </button>

      <form
        action="/admin/stock"
        method="get"
        onSubmit={(e) => {
          e.preventDefault();
          searchStock(e.currentTarget.q.value, true);
        }}
        className="relative hidden max-w-md flex-1 sm:block"
        role="search"
      >
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        <label htmlFor="global-search" className="sr-only">
          Search items
        </label>
        <input
          id="global-search"
          name="q"
          type="search"
          autoComplete="off"
          defaultValue={pathname === "/admin/stock" ? searchParams.get("q") ?? "" : ""}
          onChange={(e) => {
            clearTimeout(searchTimer.current);
            const value = e.target.value;
            searchTimer.current = setTimeout(() => searchStock(value), 300);
          }}
          placeholder="Search items, codes, brands..."
          className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:bg-surface"
        />
      </form>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="btn-ghost"
          aria-label="Switch between light and dark mode"
          title="Light or dark mode"
        >
          {/* The icon follows the class on <html>, so no state is needed */}
          <Moon size={19} className="dark:hidden" aria-hidden />
          <Sun size={19} className="hidden dark:block" aria-hidden />
        </button>

        <div className="relative" ref={alertsRef}>
          <button
            type="button"
            onClick={() => setMenu(menu === "alerts" ? null : "alerts")}
            className="btn-ghost relative"
            aria-label={`Stock alerts: ${alertCount} items low or out of stock`}
            aria-expanded={menu === "alerts"}
          >
            <Bell size={19} aria-hidden />
            {alertCount > 0 ? (
              <span className="absolute right-1 top-1 flex min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-[18px] text-white">
                {alertCount > 99 ? "99+" : alertCount}
              </span>
            ) : null}
          </button>
          {menu === "alerts" ? (
            <div className="absolute right-0 top-12 z-50 w-[min(340px,calc(100vw-24px))] overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-semibold text-heading">Stock alerts</p>
                <p className="text-xs text-muted">Items at or below their low-stock level</p>
              </div>
              {alerts.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted">Everything is in stock.</p>
              ) : (
                <ul className="max-h-80 overflow-y-auto">
                  {alerts.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/admin/stock/${a.id}`}
                        onClick={() => setMenu(null)}
                        className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-background"
                      >
                        <span className="min-w-0 truncate font-medium text-text">{a.name}</span>
                        <span className={`badge ${a.stock_status === "out" ? "badge-danger" : "badge-warning"}`}>
                          {a.stock_status === "out" ? "Out" : formatQtyUnit(a.on_hand, a.unit)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/admin/stock?status=low"
                onClick={() => setMenu(null)}
                className="block border-t border-border px-4 py-3 text-center text-sm font-semibold text-primary-ink hover:bg-background"
              >
                View all low stock
              </Link>
            </div>
          ) : null}
        </div>

        <div className="relative" ref={userRef}>
          <button
            type="button"
            onClick={() => setMenu(menu === "user" ? null : "user")}
            className="flex min-h-[44px] items-center gap-2.5 rounded-xl px-1.5 hover:bg-background sm:px-2"
            aria-expanded={menu === "user"}
            aria-label="Account menu"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-sm font-bold text-primary-ink">
              {initials(user.full_name)}
            </span>
            <span className="hidden flex-col text-left leading-tight md:flex">
              <span className="text-sm font-semibold text-heading">{user.full_name}</span>
              <span className="text-xs text-muted">{user.role === "admin" ? "Admin" : "Worker"}</span>
            </span>
            <ChevronDown size={16} className="hidden text-muted md:block" aria-hidden />
          </button>
          {menu === "user" ? (
            <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg">
              <div className="border-b border-border px-4 py-3">
                <p className="truncate text-sm font-semibold text-heading">{user.full_name}</p>
                <p className="truncate text-xs text-muted">{user.email || (user.role === "admin" ? "Administrator" : "Worker")}</p>
              </div>
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-text hover:bg-[#fee2e2] hover:text-[#dc2626]"
                >
                  <LogOut size={16} aria-hidden /> Sign out
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
