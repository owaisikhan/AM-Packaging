import "server-only";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";

// Service-role client. Bypasses RLS entirely. Used for one job only: creating
// and updating sign-in accounts on the Users page. Never import it into a
// client component.
// Returns null when SUPABASE_SERVICE_ROLE_KEY is not set (for example missing
// in Vercel), so the Users actions can say so instead of crashing the page.
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  return createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
