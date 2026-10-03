import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase-server";
import { isDemoMode, ROLES } from "./config";
import { demoProfile, demoProfiles } from "./demo-data";

export { ROLES };

/**
 * The signed-in user's profile ({ id, full_name, role, email }), or null.
 * Cached per request so the layout and the page share one lookup.
 */
export const getCurrentUser = cache(async () => {
  // DEMO_ROLE=worker shows the demo as a worker sees it, for reviewing screens.
  if (isDemoMode) {
    if (process.env.DEMO_ROLE !== "worker") return demoProfile;
    const { created_at: _c, ...worker } = demoProfiles.find((p) => p.role === "worker");
    return worker;
  }

  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (error || !claims?.sub) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, active")
    .eq("id", claims.sub)
    .maybeSingle();

  if (!profile || !profile.active) return null;
  return { ...profile, email: claims.email ?? "" };
});

/** For pages: send signed-out people to the login page, workers away from admin pages. */
export async function requirePageRole(role) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (role === ROLES.ADMIN && user.role !== ROLES.ADMIN) redirect("/admin?denied=1");
  return user;
}

/** For Server Actions: throws a readable error instead of redirecting. */
export async function requireRole(role) {
  if (isDemoMode) {
    throw new Error("This is the demo. Connect the database to save changes.");
  }
  const user = await getCurrentUser();
  if (!user) throw new Error("Your session has ended. Sign in again.");
  if (role === ROLES.ADMIN && user.role !== ROLES.ADMIN) {
    throw new Error("Only an admin can do this. Ask an admin to do it for you.");
  }
  return user;
}
