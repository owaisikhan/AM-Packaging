import { createBrowserClient } from "@supabase/ssr";

// Browser client. RLS applies with the signed-in user's session.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
