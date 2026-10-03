// Sidebar open/collapsed state lives as classes on <html>:
//   sidebar-collapsed  desktop icon rail (saved, survives reloads)
//   sidebar-open       phone/tablet drawer (never saved)
// The saved value is applied before first paint by the inline script in
// app/layout.js, so the page never flashes the wrong width.

export const SIDEBAR_KEY = "am_sidebar_collapsed";
const DESKTOP_QUERY = "(min-width: 1024px)";

export function toggleSidebar() {
  const html = document.documentElement;
  if (window.matchMedia(DESKTOP_QUERY).matches) {
    const collapsed = html.classList.toggle("sidebar-collapsed");
    try {
      localStorage.setItem(SIDEBAR_KEY, collapsed ? "true" : "false");
    } catch {
      // Private window or blocked storage: the toggle still works for this visit.
    }
  } else {
    html.classList.toggle("sidebar-open");
  }
}

export function closeMobileSidebar() {
  document.documentElement.classList.remove("sidebar-open");
}
