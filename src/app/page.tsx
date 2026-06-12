import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { MatchCard, bucketFor, type Bucket } from "@/components/MatchCard";
import { PredictionReload } from "@/components/PredictionReload";
import type { Match, Prediction, MatchWithPrediction } from "@/lib/types";
import Link from "next/link";
import { Trophy, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const profile = await requireProfile();
  const supabase = createClient();

  const [{ data: matches }, { data: preds }] = await Promise.all([
    supabase
      .from("matches")
      .select(
        "id, stage, home_team, away_team, kickoff_at, status, home_score, away_score, graded_at, created_at",
      )
      .order("kickoff_at", { ascending: true }),
    supabase
      .from("predictions")
      .select(
        "id, match_id, user_id, home_pred, away_pred, is_correct, created_at",
      ),
  ]);

  const predByMatch = new Map<string, Prediction>(
    (preds ?? []).map((p) => [p.match_id, p as Prediction]),
  );

  const nowMs = Date.now();
  const withPred: MatchWithPrediction[] = (matches ?? []).map((m) => ({
    ...(m as Match),
    prediction: predByMatch.get(m.id) ?? null,
  }));

  const open: MatchWithPrediction[] = [];
  const locked: MatchWithPrediction[] = [];
  const closed: MatchWithPrediction[] = [];
  for (const m of withPred) {
    const b = bucketFor(m, nowMs);
    if (b === "open") open.push(m);
    else if (b === "locked") locked.push(m);
    else closed.push(m);
  }
  // Open & locked: soonest first. Closed/finished: most recent first.
  closed.reverse();

  const totalPoints = (preds ?? []).filter((p) => p.is_correct === true).length;

  return (
    <AppShell displayName={profile.display_name} isAdmin={profile.is_admin}>
      <PredictionReload />
      <div className="mb-6">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          Matches
        </h1>
        <p className="mt-1 text-sm text-muted">
          Predict the exact scoreline — 1 point per exact hit. You&apos;ve
          banked{" "}
          <span className="font-semibold text-pitch-dark">
            {totalPoints} {totalPoints === 1 ? "point" : "points"}
          </span>{" "}
          so far.
        </p>
        <Link
          href="/results"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-pitch-dark underline-offset-2 hover:underline"
        >
          Public results board
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <Section title="Open" count={open.length} bucket="open">
        {open.length === 0 ? (
          <Empty>No matches open right now — check back before kickoff.</Empty>
        ) : (
          open.map((m) => <MatchCard key={m.id} match={m} bucket="open" />)
        )}
      </Section>

      <Section title="Locked in" count={locked.length} bucket="locked">
        {locked.length === 0 ? (
          <Empty>Nothing locked in yet. Open a match above and call it.</Empty>
        ) : (
          locked.map((m) => <MatchCard key={m.id} match={m} bucket="locked" />)
        )}
      </Section>

      <Section title="Closed & finished" count={closed.length} bucket="closed">
        {closed.length === 0 ? (
          <Empty>No closed matches yet.</Empty>
        ) : (
          closed.map((m) => <MatchCard key={m.id} match={m} bucket="closed" />)
        )}
      </Section>
    </AppShell>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  bucket: Bucket;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="font-display text-sm font-bold uppercase tracking-wider text-muted">
          {title}
        </h2>
        <span className="rounded-full bg-card px-2 py-0.5 text-xs font-semibold text-muted ring-1 ring-line tnum">
          {count}
        </span>
      </div>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl2 border border-dashed border-line bg-card/50 px-5 py-6 text-sm text-muted">
      <Trophy className="h-5 w-5 shrink-0 text-muted" aria-hidden />
      {children}
    </div>
  );
}
