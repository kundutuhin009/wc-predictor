import { Check, X, Lock, CalendarClock } from "lucide-react";
import type { MatchWithPrediction } from "@/lib/types";
import { formatKickoffIST, formatCloseTimeIST, closeTimeMs } from "@/lib/time";
import { OpenMatch } from "./OpenMatch";
import { Flag } from "./Flag";
import { cn } from "@/lib/cn";

export type Bucket = "open" | "locked" | "closed";

export function bucketFor(m: MatchWithPrediction, nowMs: number): Bucket {
  const finished = m.status === "finished";
  const windowClosed = closeTimeMs(m.kickoff_at) <= nowMs;
  if (finished || windowClosed) return "closed";
  if (m.prediction) return "locked";
  return "open";
}

function TeamRow({
  name,
  score,
  emphasize,
}: {
  name: string;
  score?: number | null;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span
        className={cn(
          "inline-flex min-w-0 items-center gap-2 font-display text-lg font-semibold uppercase tracking-wide",
          emphasize ? "text-ink" : "text-ink",
        )}
      >
        <Flag team={name} />
        <span className="truncate">{name}</span>
      </span>
      {score !== undefined && (
        <span className="font-mono text-2xl font-bold tabular-nums tnum">
          {score ?? "–"}
        </span>
      )}
    </div>
  );
}

export function MatchCard({
  match,
  bucket,
}: {
  match: MatchWithPrediction;
  bucket: Bucket;
}) {
  const { home_team, away_team, stage, kickoff_at, prediction, status } = match;
  const finished = status === "finished";

  return (
    <article className="rounded-xl2 border border-line bg-card p-5 shadow-card">
      {/* Header: stage + kickoff */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="stage-badge">{stage}</span>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
          <CalendarClock className="h-3.5 w-3.5" aria-hidden />
          {formatKickoffIST(kickoff_at)}
        </span>
      </div>

      {/* OPEN: teams as labels live inside the form; show matchup + form */}
      {bucket === "open" && (
        <>
          <div className="mb-1 flex items-center justify-center gap-2 font-display text-xl font-bold uppercase tracking-wide">
            <Flag team={home_team} />
            <span className="truncate">{home_team}</span>
            <span className="px-0.5 text-sm font-normal text-muted">v</span>
            <span className="truncate">{away_team}</span>
            <Flag team={away_team} />
          </div>
          <p className="text-center text-xs text-muted">
            Predictions close {formatCloseTimeIST(kickoff_at)}
          </p>
          <OpenMatch
            matchId={match.id}
            homeTeam={home_team}
            awayTeam={away_team}
            kickoffIso={kickoff_at}
          />
        </>
      )}

      {/* LOCKED-IN: read-only pick, window still open */}
      {bucket === "locked" && prediction && (
        <div>
          <div className="space-y-1.5">
            <TeamRow name={home_team} score={prediction.home_pred} />
            <TeamRow name={away_team} score={prediction.away_pred} />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-pitch-light px-2.5 py-1 text-xs font-semibold text-pitch-dark">
              <Lock className="h-3.5 w-3.5" aria-hidden />
              Locked in
            </span>
            <span className="text-xs text-muted">Your pick · final</span>
          </div>
        </div>
      )}

      {/* CLOSED / FINISHED */}
      {bucket === "closed" && (
        <ClosedBody match={match} finished={finished} />
      )}
    </article>
  );
}

function ClosedBody({
  match,
  finished,
}: {
  match: MatchWithPrediction;
  finished: boolean;
}) {
  const { home_team, away_team, prediction, home_score, away_score } = match;
  const correct = prediction?.is_correct === true;

  return (
    <div>
      {/* Actual result if finished, otherwise the matchup */}
      <div className="space-y-1.5">
        <TeamRow
          name={home_team}
          score={finished ? home_score : undefined}
        />
        <TeamRow
          name={away_team}
          score={finished ? away_score : undefined}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        {finished ? (
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Full time
          </span>
        ) : (
          <span className="text-xs font-medium text-muted">
            Predictions closed
          </span>
        )}

        {prediction ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">
              You said{" "}
              <span className="font-mono font-bold tnum">
                {prediction.home_pred}–{prediction.away_pred}
              </span>
            </span>
            {finished &&
              (correct ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-pitch-light px-2 py-0.5 text-xs font-bold text-win">
                  <Check className="h-3.5 w-3.5" aria-hidden /> +1
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-paper px-2 py-0.5 text-xs font-medium text-miss">
                  <X className="h-3.5 w-3.5" aria-hidden /> Missed
                </span>
              ))}
          </div>
        ) : (
          <span className="text-xs text-muted">Window closed</span>
        )}
      </div>
    </div>
  );
}
