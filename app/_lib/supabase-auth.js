import "server-only";
import { createClient as createAdminSupabase } from "@supabase/supabase-js";

// Service-role client. Bypasses RLS entirely. Used for one job only: creating
// and updating sign-in accounts on the Users page. Never import it into a
// client component.
export function createAdminClient() {
  return createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
