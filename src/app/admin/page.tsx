import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { AddMatchPanel } from "@/components/admin/AddMatchPanel";
import { AdminMatchRow } from "@/components/admin/AdminMatchRow";
import {
  AdminBreakdown,
  winnersByMatch,
} from "@/components/admin/AdminBreakdown";
import type { Match, AdminBreakdownRow } from "@/lib/types";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const profile = await requireProfile();
  if (!profile.is_admin) redirect("/");

  const supabase = createClient();
  const [{ data: matches }, { data: stats }, { data: breakdown }] =
    await Promise.all([
      supabase
        .from("matches")
        .select(
          "id, stage, home_team, away_team, kickoff_at, status, home_score, away_score, graded_at, created_at",
        )
        .order("kickoff_at", { ascending: true }),
      supabase.from("match_prediction_stats").select("match_id, correct_count"),
      // Hard DB-gated: returns rows only because the caller is an admin.
      supabase.rpc("get_admin_breakdown"),
    ]);

  const correctByMatch = new Map<string, number>(
    (stats ?? []).map((s) => [s.match_id as string, Number(s.correct_count)]),
  );

  const breakdownRows = (breakdown ?? []) as AdminBreakdownRow[];
  const winners = winnersByMatch(breakdownRows);

  const list = (matches ?? []) as Match[];

  return (
    <AppShell displayName={profile.display_name} isAdmin={profile.is_admin}>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pitch text-paper">
          <ShieldCheck className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            Admin
          </h1>
          <p className="text-sm text-muted">
            Edit fixtures, enter results. Results grade predictions instantly.
          </p>
        </div>
      </div>

      <div className="mb-6">
        <AddMatchPanel />
      </div>

      <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-muted">
        Fixtures · {list.length}
      </h2>
      <div className="grid gap-3">
        {list.map((m) => (
          <AdminMatchRow
            key={m.id}
            match={m}
            correctCount={correctByMatch.get(m.id) ?? null}
            winnerNames={winners.get(m.id) ?? []}
          />
        ))}
      </div>

      <h2 className="mb-3 mt-10 font-display text-sm font-bold uppercase tracking-wider text-muted">
        Who predicted what
      </h2>
      <p className="mb-3 text-sm text-muted">
        Every member&apos;s pick on each finished match. Visible to admins only.
      </p>
      <AdminBreakdown rows={breakdownRows} />
    </AppShell>
  );
}
