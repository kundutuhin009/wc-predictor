"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { LOCK_LEAD_MINUTES } from "@/lib/time";

export type SubmitResult = { ok: true } | { ok: false; error: string };

// Insert a single prediction. INSERT-ONLY: never upsert, never update.
// Re-checks the 15-minute lock server-side (never trust the client clock) and
// relies on the DB's RLS insert policy + unique constraint as the final word.
export async function submitPrediction(
  matchId: string,
  homePred: number,
  awayPred: number,
): Promise<SubmitResult> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  // Validate the scores: integers in [0, 30].
  const home = Number(homePred);
  const away = Number(awayPred);
  if (
    !Number.isInteger(home) ||
    !Number.isInteger(away) ||
    home < 0 ||
    away < 0 ||
    home > 30 ||
    away > 30
  ) {
    return { ok: false, error: "Enter a score between 0 and 30." };
  }

  // Re-check the window against the server clock: kickoff − 15 min must be future.
  const { data: match, error: matchErr } = await supabase
    .from("matches")
    .select("kickoff_at")
    .eq("id", matchId)
    .single();

  if (matchErr || !match) {
    return { ok: false, error: "That match no longer exists." };
  }

  const closeMs =
    new Date(match.kickoff_at).getTime() - LOCK_LEAD_MINUTES * 60_000;
  if (closeMs <= Date.now()) {
    return { ok: false, error: "Predictions closed." };
  }

  const { error } = await supabase.from("predictions").insert({
    match_id: matchId,
    user_id: user.id,
    home_pred: home,
    away_pred: away,
  });

  if (error) {
    // 23505 = unique_violation → they already locked this match in.
    if (error.code === "23505") {
      return { ok: false, error: "You've already locked this in." };
    }
    // RLS insert policy rejects a late submission (race past the client check).
    if (error.code === "42501") {
      return { ok: false, error: "Predictions closed." };
    }
    return { ok: false, error: "Couldn't save your pick. Try again." };
  }

  revalidatePath("/");
  return { ok: true };
}
