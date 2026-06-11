"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";
import { submitPrediction } from "@/app/actions/predictions";
import { Flag } from "./Flag";
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
  const router = useRouter();
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [confirming, setConfirming] = useState(false);
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
    startTransition(async () => {
      const res = await submitPrediction(matchId, Number(home), Number(away));
      if (res.ok) {
        toast("Prediction locked in.", "success");
        router.refresh();
      } else {
        toast(res.error, "error");
        setConfirming(false);
        router.refresh();
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
            <Flag team={homeTeam} />
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
            <Flag team={awayTeam} />
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
    </form>
  );
}
