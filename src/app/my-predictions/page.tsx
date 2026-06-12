import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { TeamFlag } from "@/components/TeamFlag";
import { formatKickoffIST, closeTimeMs } from "@/lib/time";
import { Check, X, Lock, CalendarClock, ClipboardList } from "lucide-react";
import type { MatchStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

// One of the current user's predictions, with its match embedded.
type MyPrediction = {
  id: string;
  home_pred: number;
  away_pred: number;
  is_correct: boolean | null;
  match: {
    id: string;
    stage: string;
    home_team: string;
    away_team: string;
    kickoff_at: string;
    status: MatchStatus;
    home_score: number | null;
    away_score: number | null;
  } | null;
};

// Read-only history of the member's own locked-in picks for matches that are no
// longer open (window closed or finished). Still-open picks live on Matches (/).
export default async function MyPredictionsPage() {
  const profile = await requireProfile();
  const supabase = createClient();

  // RLS restricts predictions to the owner; we filter by user_id too for clarity.
  const { data } = await supabase
    .from("predictions")
    .select(
      "id, home_pred, away_pred, is_correct, match:matches(id, stage, home_team, away_team, kickoff_at, status, home_score, away_score)",
    )
    .eq("user_id", profile.id);

  const nowMs = Date.now();
  const rows = ((data ?? []) as unknown as MyPrediction[])
    .filter(
      (p) =>
        p.match &&
        (p.match.status === "finished" ||
          closeTimeMs(p.match.kickoff_at) <= nowMs),
    )
    // newest match first
    .sort(
      (a, b) =>
        new Date(b.match!.kickoff_at).getTime() -
        new Date(a.match!.kickoff_at).getTime(),
    );

  return (
    <AppShell displayName={profile.display_name} isAdmin={profile.is_admin}>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pitch text-paper">
          <ClipboardList className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            My Predictions
          </h1>
          <p className="text-sm text-muted">
            Your locked-in picks for closed &amp; finished matches.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl2 border border-dashed border-line bg-card/50 px-5 py-8 text-center text-sm text-muted">
          You haven&apos;t made any predictions for past matches yet.
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.map((p) => (
            <PredictionCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

function PredictionCard({ p }: { p: MyPrediction }) {
  const m = p.match!;
  const finished = m.status === "finished";
  const correct = p.is_correct === true;

  return (
    <article className="rounded-xl2 border border-line bg-card p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="stage-badge">{m.stage}</span>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
          <CalendarClock className="h-3.5 w-3.5" aria-hidden />
          {formatKickoffIST(m.kickoff_at)}
        </span>
      </div>

      {/* Scoreboard: the actual final score when finished, else the matchup */}
      <div className="space-y-1.5">
        <TeamRow team={m.home_team} actual={m.home_score} finished={finished} />
        <TeamRow team={m.away_team} actual={m.away_score} finished={finished} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <span className="text-xs text-muted">
          Your pick{" "}
          <span className="font-mono font-bold tnum text-pitch-dark">
            {p.home_pred}–{p.away_pred}
          </span>
        </span>

        {finished ? (
          correct ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-pitch-light px-2.5 py-1 text-xs font-bold text-win">
              <Check className="h-3.5 w-3.5" aria-hidden /> Correct +1
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-paper px-2.5 py-1 text-xs font-medium text-miss">
              <X className="h-3.5 w-3.5" aria-hidden /> Missed
            </span>
          )
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-pitch-light px-2.5 py-1 text-xs font-semibold text-pitch-dark">
            <Lock className="h-3.5 w-3.5" aria-hidden /> Locked — awaiting result
          </span>
        )}
      </div>
    </article>
  );
}

// One team row: flag + name on the left; the actual final score (cream) on the
// right when the match is finished. Read-only — no inputs.
function TeamRow({
  team,
  actual,
  finished,
}: {
  team: string;
  actual: number | null;
  finished: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="inline-flex min-w-0 items-center gap-2 font-display text-lg font-semibold uppercase tracking-wide">
        <TeamFlag team={team} />
        <span className="truncate">{team}</span>
      </span>
      {finished && (
        <span className="font-mono text-2xl font-bold tnum text-ink" title="Final score">
          {actual ?? "–"}
        </span>
      )}
    </div>
  );
}
