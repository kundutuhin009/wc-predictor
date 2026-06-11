import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

// Resolve the signed-in user's profile in a Server Component.
// Redirects to /login if not signed in, or back to /login if the profile row
// is missing (the login flow creates it — this only happens mid-signup).
export async function requireProfile(): Promise<Profile> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, display_name, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/login");
  return profile as Profile;
}
