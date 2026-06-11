import { Check, X } from "lucide-react";
import type { AdminBreakdownRow } from "@/lib/types";
import { formatKickoffIST } from "@/lib/time";
import { Flag } from "../Flag";

// Grouped per-match breakdown of every member's pick (admin-only).
// Data comes from get_admin_breakdown(), which returns nothing to non-admins.
export function AdminBreakdown({ rows }: { rows: AdminBreakdownRow[] }) {
  // Finished matches only, and only rows where a pick actually exists.
  const picks = rows.filter(
    (r) => r.status === "finished" && r.home_pred != null,
  );

  // Group by match, keeping match meta from the first row seen.
  const groups = new Map<
    string,
    { meta: AdminBreakdownRow; picks: AdminBreakdownRow[] }
  >();
  for (const r of picks) {
    const g = groups.get(r.match_id);
    if (g) g.picks.push(r);
    else groups.set(r.match_id, { meta: r, picks: [r] });
  }

  // Most recent kickoff first.
  const ordered = Array.from(groups.values()).sort(
    (a, b) =>
      new Date(b.meta.kickoff_at).getTime() -
      new Date(a.meta.kickoff_at).getTime(),
  );

  if (ordered.length === 0) {
    return (
      <div className="rounded-xl2 border border-dashed border-line bg-card/50 px-5 py-6 text-sm text-muted">
        No graded matches yet — breakdowns appear once you enter results.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {ordered.map(({ meta, picks }) => {
        // Correct picks first, then by name.
        const sorted = [...picks].sort((a, b) => {
          if (a.is_correct !== b.is_correct) return a.is_correct ? -1 : 1;
          return (a.display_name ?? "").localeCompare(b.display_name ?? "");
        });
        const correct = picks.filter((p) => p.is_correct).length;
        return (
          <article
            key={meta.match_id}
            className="rounded-xl2 border border-line bg-card p-5 shadow-card"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <span className="stage-badge">{meta.stage}</span>
                <h3 className="mt-1.5 flex items-center gap-2 font-display text-lg font-semibold uppercase tracking-wide">
                  <Flag team={meta.home_team} />
                  <span className="truncate">{meta.home_team}</span>
                  <span className="text-sm font-normal text-muted">v</span>
                  <span className="truncate">{meta.away_team}</span>
                  <Flag team={meta.away_team} />
                </h3>
                <p className="text-xs text-muted">
                  {formatKickoffIST(meta.kickoff_at)}
                </p>
              </div>
              <div className="text-right">
                <div className="font-mono text-2xl font-bold tnum">
                  {meta.home_score}–{meta.away_score}
                </div>
                <div className="text-xs text-pitch-dark">
                  {correct} / {picks.length} correct
                </div>
              </div>
            </div>

            <ul className="divide-y divide-line/70">
              {sorted.map((p, i) => (
                <li
                  key={`${meta.match_id}-${p.display_name}-${i}`}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <span className="truncate text-sm font-medium text-ink">
                    {p.display_name ?? "—"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold tnum text-muted">
                      {p.home_pred}–{p.away_pred}
                    </span>
                    {p.is_correct ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-pitch-light px-2 py-0.5 text-xs font-bold text-win">
                        <Check className="h-3.5 w-3.5" aria-hidden /> Correct
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-paper px-2 py-0.5 text-xs font-medium text-miss">
                        <X className="h-3.5 w-3.5" aria-hidden /> Off
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </article>
        );
      })}
    </div>
  );
}

// Helper: winner display names per match, for inline display in the fixture list.
export function winnersByMatch(
  rows: AdminBreakdownRow[],
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const r of rows) {
    if (r.is_correct && r.display_name) {
      const arr = map.get(r.match_id) ?? [];
      arr.push(r.display_name);
      map.set(r.match_id, arr);
    }
  }
  map.forEach((v, k) => map.set(k, v.sort((a, b) => a.localeCompare(b))));
  return map;
}
