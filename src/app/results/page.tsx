import Link from "next/link";
import { createAnonClient } from "@/lib/supabase/anon";
import { FocusRefresh } from "@/components/FocusRefresh";
import { TeamFlag } from "@/components/TeamFlag";
import type { PublicResult } from "@/lib/types";
import { formatKickoffIST } from "@/lib/time";
import { Trophy, Check, CalendarClock, LogIn } from "lucide-react";

// Public, no-login announcement board. Reads ONLY the anon-granted
// `public_results` view — never `predictions` or `profiles` directly.
// Dynamic (not ISR) so a freshly-graded match shows immediately instead of
// being hidden behind a stale cached snapshot.
export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const supabase = createAnonClient();
  const { data } = await supabase
    .from("public_results")
    .select(
      "match_id, stage, home_team, away_team, kickoff_at, home_score, away_score, graded_at, winners_count, winner_names",
    )
    .order("graded_at", { ascending: false, nullsFirst: false });

  const results = (data ?? []) as PublicResult[];

  return (
    <div className="min-h-dvh">
      <FocusRefresh />
      <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/results"
            aria-label="WC26 Results — home"
            className="flex items-center gap-2 rounded-lg transition-opacity hover:opacity-80 focus-visible:opacity-80"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pitch text-paper">
              <Trophy className="h-4 w-4" aria-hidden />
            </span>
            <span className="font-display text-base font-extrabold leading-none tracking-tight">
              WC26
              <span className="block text-[10px] font-bold uppercase tracking-widest text-pitch-dark">
                Results
              </span>
            </span>
          </Link>
          <Link href="/login" className="btn-ghost text-sm">
            <LogIn className="h-4 w-4" aria-hidden />
            Members sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 pb-24">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            Results
          </h1>
          <p className="mt-1 text-sm text-muted">
            Final scores and who called them exactly. Results update
            automatically as admins confirm scores.
          </p>
        </div>

        {results.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl2 border border-dashed border-line bg-card/50 px-5 py-8 text-sm text-muted">
            <Trophy className="h-5 w-5 shrink-0 text-muted" aria-hidden />
            No results yet — check back once matches finish.
          </div>
        ) : (
          <div className="grid gap-3">
            {results.map((r) => (
              <ResultCard key={r.match_id} result={r} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ResultCard({ result }: { result: PublicResult }) {
  const {
    stage,
    home_team,
    away_team,
    home_score,
    away_score,
    kickoff_at,
    winners_count,
    winner_names,
  } = result;

  return (
    <article className="rounded-xl2 border border-line bg-card p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="stage-badge">{stage}</span>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
          <CalendarClock className="h-3.5 w-3.5" aria-hidden />
          {formatKickoffIST(kickoff_at)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex min-w-0 flex-1 items-center gap-2 font-display text-lg font-semibold uppercase tracking-wide">
          <TeamFlag team={home_team} />
          <span className="truncate">{home_team}</span>
        </span>
        <span className="shrink-0 font-mono text-2xl font-bold tnum">
          {home_score}
          <span className="px-1 text-muted">–</span>
          {away_score}
        </span>
        <span className="inline-flex min-w-0 flex-1 items-center justify-end gap-2 text-right font-display text-lg font-semibold uppercase tracking-wide">
          <span className="truncate">{away_team}</span>
          <TeamFlag team={away_team} />
        </span>
      </div>

      <div className="mt-4 border-t border-line pt-3">
        {winners_count > 0 ? (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1 font-semibold text-pitch-dark">
              <Check className="h-4 w-4" aria-hidden /> Nailed it:
            </span>
            <span className="text-ink">{winner_names.join(", ")}</span>
          </p>
        ) : (
          <p className="text-sm text-muted">
            Nobody predicted this one exactly.
          </p>
        )}
      </div>
    </article>
  );
}
