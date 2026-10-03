import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Two jobs: refresh the Supabase session cookie (Server Components cannot
// write cookies) and send signed-out visitors to /login. This only decides
// redirects; the data is protected by RLS and the role checks in each page
// and action.
export default async function proxy(request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Demo mode: no database configured, nothing to refresh or protect.
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getSession reads the cookie and only calls Supabase near expiry, so this
  // costs no round trip on most requests. Verification happens in the pages.
  const { data } = await supabase.auth.getSession();
  const signedIn = Boolean(data?.session);
  const { pathname } = request.nextUrl;

  if (!signedIn && (pathname === "/admin" || pathname.startsWith("/admin/"))) {
    const to = request.nextUrl.clone();
    to.pathname = "/login";
    to.search = "";
    if (pathname !== "/admin") to.searchParams.set("next", pathname);
    return NextResponse.redirect(to);
  }

  if (signedIn && pathname === "/login") {
    const to = request.nextUrl.clone();
    to.pathname = "/admin";
    to.search = "";
    return NextResponse.redirect(to);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)"],
};
