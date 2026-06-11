import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Anonymous, session-less Supabase client for PUBLIC reads (e.g. /results).
// Uses the anon key and never touches auth cookies, so it can only ever see
// data the `anon` role is granted — here, the `public_results` view.
export function createAnonClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
