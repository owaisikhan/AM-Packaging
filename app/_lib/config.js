// Demo mode: when no Supabase project is configured, the app runs on the
// sample data in demo-data.js so the screens can be reviewed before the
// database exists. Saving is switched off in demo mode.
export const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const ROLES = { ADMIN: "admin", WORKER: "worker" };
