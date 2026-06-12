"use client";

import { useState, useRef, useTransition } from "react";
import { Lock, Loader2 } from "lucide-react";
import { submitPrediction } from "@/app/actions/predictions";
import { TeamFlag } from "./TeamFlag";
import { toast } from "@/lib/toast";

export function PredictionForm({
  matchId,
  homeTeam,
  awayTeam,
}: {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
}) {
  // Visual default only — pre-fill 0–0 to save typing. The user must still click
  // "Lock in prediction" (and confirm) to submit; nothing is saved automatically.
  const [home, setHome] = useState("0");
  const [away, setAway] = useState("0");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const homeRef = useRef<HTMLInputElement>(null);

  const valid =
    home !== "" &&
    away !== "" &&
    Number(home) >= 0 &&
    Number(away) >= 0 &&
    Number(home) <= 30 &&
    Number(away) <= 30;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setConfirming(true);
  }

  function lockIn() {
    setError(null);
    startTransition(async () => {
      const res = await submitPrediction(matchId, Number(home), Number(away));
      if (res.ok) {
        // Reliable update: a full reload re-fetches server data so the home page
        // re-buckets THIS match into its read-only "Locked in" state (the locked
        // state is derived from whether a prediction row exists). router.refresh()
        // was not updating the card reliably. Stash a flash + scroll for after.
        try {
          sessionStorage.setItem("pred-scroll", String(window.scrollY));
          sessionStorage.setItem("pred-flash", "Prediction locked in.");
        } catch {
          /* sessionStorage unavailable — reload still works */
        }
        window.location.reload();
      } else {
        // Error (e.g. window closed, or already locked in): show it inline, no
        // reload. The 15-min lock + insert-only rule stay enforced server-side.
        setError(res.error);
        toast(res.error, "error");
        setConfirming(false);
      }
    });
  }

  function clampInput(v: string): string {
    const digits = v.replace(/\D/g, "").slice(0, 2);
    if (digits === "") return "";
    return String(Math.min(30, Number(digits)));
  }

  return (
    <form onSubmit={onSubmit} className="mt-4">
      <div className="flex items-center justify-center gap-3 sm:gap-5">
        <label className="flex flex-col items-center gap-1.5">
          <span className="inline-flex max-w-[7rem] items-center gap-1.5 text-xs font-semibold text-muted">
            <TeamFlag team={homeTeam} />
            <span className="truncate">{homeTeam}</span>
          </span>
          <input
            ref={homeRef}
            type="number"
            inputMode="numeric"
            min={0}
            max={30}
            required
            aria-label={`${homeTeam} score`}
            value={home}
            onChange={(e) => setHome(clampInput(e.target.value))}
            placeholder="0"
            className="score-input"
          />
        </label>

        <span className="mt-5 font-display text-2xl font-bold text-muted">
          –
        </span>

        <label className="flex flex-col items-center gap-1.5">
          <span className="inline-flex max-w-[7rem] items-center gap-1.5 text-xs font-semibold text-muted">
            <TeamFlag team={awayTeam} />
            <span className="truncate">{awayTeam}</span>
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={30}
            required
            aria-label={`${awayTeam} score`}
            value={away}
            onChange={(e) => setAway(clampInput(e.target.value))}
            placeholder="0"
            className="score-input"
          />
        </label>
      </div>

      <p className="mt-3 text-center text-xs text-muted">
        Predict the score at end of regular + extra time (before penalties).
      </p>

      {!confirming ? (
        <button
          type="submit"
          disabled={!valid}
          className="btn-primary mt-4 w-full"
        >
          <Lock className="h-4 w-4" aria-hidden />
          Lock in prediction
        </button>
      ) : (
        <div className="mt-4 rounded-xl border border-amber/40 bg-amber-light/60 p-3 animate-pop-in">
          <p className="text-center text-sm font-medium text-ink">
            Lock in{" "}
            <span className="font-mono font-bold tnum">
              {home}–{away}
            </span>
            ? This is final and can&apos;t be changed.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="btn-ghost flex-1"
            >
              Back
            </button>
            <button
              type="button"
              onClick={lockIn}
              disabled={pending}
              className="btn-primary flex-1"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <>
                  <Lock className="h-4 w-4" aria-hidden />
                  Confirm
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-sm text-red-300"
        >
          {error}
        </p>
      )}
    </form>
  );
}
