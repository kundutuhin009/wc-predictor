"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save } from "lucide-react";
import { addMatch, updateMatch, type ActionResult } from "@/app/actions/admin";
import { toast } from "@/lib/toast";

const STAGES = [
  "Group",
  "R32",
  "R16",
  "QF",
  "SF",
  "Bronze",
  "Final",
] as const;

type Props =
  | {
      mode: "add";
      onDone?: () => void;
      initial?: undefined;
      matchId?: undefined;
    }
  | {
      mode: "edit";
      matchId: string;
      initial: {
        stage: string;
        home_team: string;
        away_team: string;
        kickoff_local: string;
      };
      onDone?: () => void;
    };

export function MatchForm(props: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const initial = props.mode === "edit" ? props.initial : undefined;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const formEl = e.currentTarget;
    startTransition(async () => {
      let res: ActionResult;
      if (props.mode === "add") {
        res = await addMatch(form);
      } else {
        res = await updateMatch(props.matchId, form);
      }
      if (res.ok) {
        toast(props.mode === "add" ? "Match added." : "Match updated.");
        if (props.mode === "add") formEl.reset();
        props.onDone?.();
        router.refresh();
      } else {
        toast(res.error, "error");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">
            Stage
          </span>
          <select
            name="stage"
            defaultValue={initial?.stage ?? "Group"}
            className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-pitch focus:bg-white"
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">
            Kickoff (IST)
          </span>
          <input
            type="datetime-local"
            name="kickoff_local"
            required
            defaultValue={initial?.kickoff_local ?? ""}
            className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-pitch focus:bg-white"
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">
            Home team
          </span>
          <input
            type="text"
            name="home_team"
            required
            maxLength={40}
            defaultValue={initial?.home_team ?? ""}
            placeholder="e.g. Brazil"
            className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-pitch focus:bg-white"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">
            Away team
          </span>
          <input
            type="text"
            name="away_team"
            required
            maxLength={40}
            defaultValue={initial?.away_team ?? ""}
            placeholder="e.g. Morocco"
            className="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-pitch focus:bg-white"
          />
        </label>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : props.mode === "add" ? (
            <>
              <Plus className="h-4 w-4" aria-hidden /> Add match
            </>
          ) : (
            <>
              <Save className="h-4 w-4" aria-hidden /> Save changes
            </>
          )}
        </button>
        {props.mode === "edit" && (
          <button
            type="button"
            onClick={props.onDone}
            disabled={pending}
            className="btn-ghost"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
