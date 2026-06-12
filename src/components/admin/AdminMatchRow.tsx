"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Loader2, Check } from "lucide-react";
import { enterResult, deleteMatch } from "@/app/actions/admin";
import { MatchForm } from "./MatchForm";
import { TeamFlag } from "../TeamFlag";
import { formatKickoffIST, utcToISTLocalInput } from "@/lib/time";
import type { Match } from "@/lib/types";
import { toast } from "@/lib/toast";

// Per-match result entry. Its score state lives ENTIRELY inside this component,
// so it can never bleed into another match's row. It is mounted fresh (keyed by
// match.id) when the admin opens the entry panel and unmounts on save/cancel —
// nothing stale survives. Defaults are empty for an un-entered match, or the
// existing score when editing a finished one. autoComplete is off and the inputs
// carry match-scoped names so the browser can't autofill one row from another.
function ResultEntry({
  match,
  onClose,
}: {
  match: Match;
  onClose: () => void;
}) {
  const router = useRouter();
  const finished = match.status === "finished";
  const [home, setHome] = useState(
    finished && match.home_score != null ? String(match.home_score) : "",
  );
  const [away, setAway] = useState(
    finished && match.away_score != null ? String(match.away_score) : "",
  );
  const [pending, startTransition] = useTransition();
  // Per-mount nonce: makes the input names unguessable & unique so the browser
  // has no saved value to autofill into them (defeats Chrome's value-history
  // dropdown, which is what was filling the next match's fields).
  const fieldId = useId();

  const numField = (v: string) => v.replace(/\D/g, "").slice(0, 2);

  function save() {
    if (home === "" || away === "") {
      toast("Both scores are required.", "error");
      return;
    }
    startTransition(async () => {
      const res = await enterResult(match.id, Number(home), Number(away));
      if (res.ok) {
        toast(finished ? "Result updated." : "Result saved & graded.");
        onClose(); // unmounts this entry — its score state is discarded
        router.refresh();
      } else {
        toast(res.error, "error");
      }
    });
  }

  return (
    <div className="mt-4 rounded-lg bg-paper p-3">
      {/* autoComplete="off" on the form + nonce names + text/inputMode kills the
          browser autofill dropdown that was carrying scores between rows. */}
      <form
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className="flex items-center justify-center gap-3">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            name={`score-${fieldId}-home`}
            autoComplete="off"
            data-lpignore="true"
            data-1p-ignore="true"
            aria-label={`${match.home_team} final score`}
            value={home}
            onChange={(e) => setHome(numField(e.target.value))}
            placeholder="0"
            className="h-12 w-14 rounded-lg border-2 border-line bg-paper text-center font-mono text-xl font-bold tnum outline-none focus:border-pitch"
          />
          <span className="font-bold text-muted">–</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            name={`score-${fieldId}-away`}
            autoComplete="off"
            data-lpignore="true"
            data-1p-ignore="true"
            aria-label={`${match.away_team} final score`}
            value={away}
            onChange={(e) => setAway(numField(e.target.value))}
            placeholder="0"
            className="h-12 w-14 rounded-lg border-2 border-line bg-paper text-center font-mono text-xl font-bold tnum outline-none focus:border-pitch"
          />
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="btn-ghost flex-1"
          >
            Cancel
          </button>
          <button type="submit" disabled={pending} className="btn-primary flex-1">
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              "Save result"
            )}
          </button>
        </div>
      </form>
      <p className="mt-2 text-center text-[11px] text-muted">
        Score at end of regular + extra time, before penalties.
      </p>
    </div>
  );
}

export function AdminMatchRow({
  match,
  correctCount,
  winnerNames = [],
}: {
  match: Match;
  correctCount: number | null;
  winnerNames?: string[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [enteringResult, setEnteringResult] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  const finished = match.status === "finished";

  function removeMatch() {
    startTransition(async () => {
      const res = await deleteMatch(match.id);
      if (res.ok) {
        toast("Match deleted.");
        router.refresh();
      } else {
        toast(res.error, "error");
      }
    });
  }

  return (
    <article className="rounded-xl border border-line bg-card p-4 shadow-sm">
      {editing ? (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
            Edit fixture
          </p>
          <MatchForm
            mode="edit"
            matchId={match.id}
            initial={{
              stage: match.stage,
              home_team: match.home_team,
              away_team: match.away_team,
              kickoff_local: utcToISTLocalInput(match.kickoff_at),
            }}
            onDone={() => setEditing(false)}
          />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="stage-badge">{match.stage}</span>
                {finished && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-pitch-light px-2 py-0.5 text-xs font-semibold text-pitch-dark">
                    <Check className="h-3 w-3" aria-hidden /> Final
                  </span>
                )}
              </div>
              <h3 className="mt-1.5 flex items-center gap-2 font-display text-lg font-semibold uppercase tracking-wide">
                <TeamFlag team={match.home_team} />
                <span className="truncate">{match.home_team}</span>
                <span className="text-sm font-normal text-muted">v</span>
                <span className="truncate">{match.away_team}</span>
                <TeamFlag team={match.away_team} />
              </h3>
              <p className="text-xs text-muted">
                {formatKickoffIST(match.kickoff_at)}
              </p>
            </div>
            {finished && (
              <div className="shrink-0 text-right">
                <div className="font-mono text-2xl font-bold tnum">
                  {match.home_score}–{match.away_score}
                </div>
                {correctCount != null && (
                  <div className="text-xs text-pitch-dark">
                    {correctCount} correct
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Inline winners — who nailed this finished match, at a glance */}
          {finished && (
            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-pitch-light/50 px-3 py-2 text-xs">
              <span className="inline-flex items-center gap-1 font-semibold text-pitch-dark">
                <Check className="h-3.5 w-3.5" aria-hidden /> Winners:
              </span>
              <span className="text-ink">
                {winnerNames.length > 0
                  ? winnerNames.join(", ")
                  : "nobody nailed it"}
              </span>
            </p>
          )}

          {/* Result entry — its own isolated component, fresh per open. */}
          {enteringResult ? (
            <ResultEntry
              key={match.id}
              match={match}
              onClose={() => setEnteringResult(false)}
            />
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setEnteringResult(true)}
                className="btn-ghost text-sm"
              >
                {finished ? "Edit result" : "Enter result"}
              </button>
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-paper hover:text-ink"
              >
                <Pencil className="h-4 w-4" aria-hidden /> Edit fixture
              </button>
              <div className="ml-auto">
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">Delete?</span>
                    <button
                      onClick={removeMatch}
                      disabled={pending}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    >
                      {pending ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        "Yes, delete"
                      )}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="text-sm text-muted hover:text-ink"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    aria-label="Delete match"
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-red-500/15 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </article>
  );
}
