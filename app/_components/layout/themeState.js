// Theme and sidebar preferences, applied before first paint so the page never
// flashes light-then-dark or wide-then-narrow. Runs as an inline script in
// app/layout.js; wrapped in try/catch because storage can be blocked.
export const THEME_KEY = "am_theme";

export const PREPAINT_SCRIPT = `(function(){try{var d=document.documentElement;if(localStorage.getItem("${THEME_KEY}")==="dark")d.classList.add("dark");if(localStorage.getItem("am_sidebar_collapsed")==="true")d.classList.add("sidebar-collapsed");}catch(e){}})();`;
