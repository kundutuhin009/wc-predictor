import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import type { LeaderboardRow } from "@/lib/types";
import { Trophy, Medal } from "lucide-react";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const profile = await requireProfile();
  const supabase = createClient();

  const { data } = await supabase
    .from("leaderboard")
    .select("user_id, display_name, points, graded_predictions, goal_diff_score")
    .order("points", { ascending: false })
    .order("goal_diff_score", { ascending: true })
    .order("display_name", { ascending: true });

  const rows = (data ?? []) as LeaderboardRow[];

  return (
    <AppShell displayName={profile.display_name} isAdmin={profile.is_admin}>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber text-paper">
          <Trophy className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            Standings
          </h1>
          <p className="text-sm text-muted">
            Exact score = 3 pts, correct result = 1 pt. Highest wins.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl2 border border-dashed border-line bg-card/50 px-5 py-8 text-center text-sm text-muted">
          No standings yet — points show up once matches are graded.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl2 border border-line bg-card shadow-card">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="w-14 px-4 py-3 text-center">#</th>
                <th className="px-2 py-3">Player</th>
                <th className="px-4 py-3 text-right">Pts</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const rank = i + 1;
                const isMe = row.user_id === profile.id;
                return (
                  <tr
                    key={row.user_id}
                    className={cn(
                      "border-b border-line/70 last:border-0 transition-colors",
                      isMe && "bg-pitch-light/60",
                    )}
                  >
                    <td className="px-4 py-3 text-center">
                      <RankBadge rank={rank} />
                    </td>
                    <td className="px-2 py-3">
                      <span className="font-display font-bold">
                        {row.display_name}
                      </span>
                      {isMe && (
                        <span className="ml-2 rounded-full bg-pitch px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-paper">
                          You
                        </span>
                      )}
                      <span className="block text-xs text-muted">
                        {row.graded_predictions} graded
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-xl font-bold tnum">
                        {row.points}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 px-1 text-xs text-muted">
        Ties broken by the closest total-goals aggregate (smallest combined
        difference across graded matches).
      </p>
    </AppShell>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    const tone =
      rank === 1
        ? "bg-amber text-paper"
        : rank === 2
          ? "bg-line text-ink"
          : "bg-amber-light text-amber-dark";
    return (
      <span
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center gap-0.5 rounded-full font-mono text-sm font-bold tnum",
          tone,
        )}
        title={`Rank ${rank}`}
      >
        <Medal className="h-3.5 w-3.5" aria-hidden />
        {rank}
      </span>
    );
  }
  return (
    <span className="font-mono text-sm font-semibold text-muted tnum">
      {rank}
    </span>
  );
}
