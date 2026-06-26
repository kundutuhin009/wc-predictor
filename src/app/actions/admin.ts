"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { istLocalInputToUTC } from "@/lib/time";

export type ActionResult = { ok: true } | { ok: false; error: string };

// Guard: resolve the caller and confirm they're an admin. RLS also enforces this
// on every write, but we fail fast here with a clear message.
async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, error: "Not signed in." as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin)
    return { supabase, error: "Admins only." as const };
  return { supabase, error: null, userId: user.id };
}

type MatchInput = {
  stage: string;
  home_team: string;
  away_team: string;
  kickoff_local: string; // datetime-local, IST wall clock
};

function parseMatchInput(form: FormData): MatchInput | null {
  const stage = String(form.get("stage") ?? "").trim();
  const home_team = String(form.get("home_team") ?? "").trim();
  const away_team = String(form.get("away_team") ?? "").trim();
  const kickoff_local = String(form.get("kickoff_local") ?? "").trim();
  if (!stage || !home_team || !away_team || !kickoff_local) return null;
  return { stage, home_team, away_team, kickoff_local };
}

export async function addMatch(form: FormData): Promise<ActionResult> {
  const { supabase, error, userId } = await requireAdmin();
  if (error) return { ok: false, error };

  const input = parseMatchInput(form);
  if (!input) return { ok: false, error: "Fill in every field." };

  const { error: dbErr } = await supabase.from("matches").insert({
    stage: input.stage,
    home_team: input.home_team,
    away_team: input.away_team,
    kickoff_at: istLocalInputToUTC(input.kickoff_local),
    created_by: userId,
  });
  if (dbErr) return { ok: false, error: dbErr.message };

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

export async function updateMatch(
  matchId: string,
  form: FormData,
): Promise<ActionResult> {
  const { supabase, error } = await requireAdmin();
  if (error) return { ok: false, error };

  const input = parseMatchInput(form);
  if (!input) return { ok: false, error: "Fill in every field." };

  const { error: dbErr } = await supabase
    .from("matches")
    .update({
      stage: input.stage,
      home_team: input.home_team,
      away_team: input.away_team,
      kickoff_at: istLocalInputToUTC(input.kickoff_local),
    })
    .eq("id", matchId);
  if (dbErr) return { ok: false, error: dbErr.message };

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

// Set a final score. The DB trigger grades all predictions synchronously.
export async function enterResult(
  matchId: string,
  homeScore: number,
  awayScore: number,
): Promise<ActionResult> {
  const { supabase, error } = await requireAdmin();
  if (error) return { ok: false, error };

  const home = Number(homeScore);
  const away = Number(awayScore);
  if (
    !Number.isInteger(home) ||
    !Number.isInteger(away) ||
    home < 0 ||
    away < 0
  ) {
    return { ok: false, error: "Both scores must be whole numbers ≥ 0." };
  }

  const { error: dbErr } = await supabase
    .from("matches")
    .update({
      status: "finished",
      home_score: home,
      away_score: away,
    })
    .eq("id", matchId);
  if (dbErr) return { ok: false, error: dbErr.message };

  // Grading changes scores, standings AND the public results board — invalidate
  // every cached surface so a freshly-entered result shows up immediately.
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/leaderboard");
  revalidatePath("/results");
  return { ok: true };
}

export async function deleteMatch(matchId: string): Promise<ActionResult> {
  const { supabase, error } = await requireAdmin();
  if (error) return { ok: false, error };

  const { error: dbErr } = await supabase
    .from("matches")
    .delete()
    .eq("id", matchId);
  if (dbErr) return { ok: false, error: dbErr.message };

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/leaderboard");
  revalidatePath("/results");
  return { ok: true };
}
