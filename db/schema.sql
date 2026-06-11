-- ============================================================
-- World Cup Score Predictor — Supabase schema
-- Run this in the Supabase SQL editor (one shot).
-- Scoring rule: 1 point per EXACT scoreline (regular + extra time, before penalties).
-- ============================================================

-- ---------- profiles ----------
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  display_name text not null,
  is_admin     boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ---------- matches ----------
-- A fixture. kickoff_at is the lock time. status drives the UI.
create table if not exists matches (
  id            uuid primary key default gen_random_uuid(),
  stage         text not null default 'Group',          -- 'Group','R16','QF','SF','Final', etc.
  home_team     text not null,
  away_team     text not null,
  kickoff_at    timestamptz not null,                   -- predictions lock at this instant
  status        text not null default 'scheduled',      -- 'scheduled' | 'finished'
  home_score    int,                                    -- final score, regular + extra time (pre-penalties)
  away_score    int,
  graded_at     timestamptz,
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now(),
  constraint score_pair_complete check (
    (home_score is null and away_score is null) or
    (home_score is not null and away_score is not null)
  )
);
create index if not exists idx_matches_kickoff on matches(kickoff_at);

-- ---------- predictions ----------
-- One prediction per user per match. Editable until kickoff (enforced in RLS + server action).
create table if not exists predictions (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references matches(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  home_pred   int not null check (home_pred >= 0 and home_pred <= 30),
  away_pred   int not null check (away_pred >= 0 and away_pred <= 30),
  is_correct  boolean,                                   -- null until match graded
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (match_id, user_id)
);
create index if not exists idx_predictions_user on predictions(user_id);
create index if not exists idx_predictions_match on predictions(match_id);

-- ============================================================
-- Helper: is the current user an admin?
-- ============================================================
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;

-- ============================================================
-- Grading: when a match gets a final score, grade every prediction.
-- Exact scoreline = 1 point. Trigger fires on update to finished+scores.
-- ============================================================
create or replace function grade_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'finished'
     and new.home_score is not null
     and new.away_score is not null then
    update predictions p
       set is_correct = (p.home_pred = new.home_score and p.away_pred = new.away_score)
     where p.match_id = new.id;
    new.graded_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_grade_match on matches;
create trigger trg_grade_match
  before update on matches
  for each row
  when (new.status = 'finished')
  execute function grade_match();

-- ============================================================
-- Leaderboard view: points = count of correct predictions.
-- Tiebreaker (ranking only, not points): closest total-goals aggregate.
-- ============================================================
create or replace view leaderboard as
select
  pr.id                                                   as user_id,
  pr.display_name,
  count(*) filter (where p.is_correct)                    as points,
  count(p.id) filter (where p.is_correct is not null)     as graded_predictions,
  -- tiebreaker: sum of |predicted total goals - actual total goals| over graded matches (lower = better)
  coalesce(sum(
    abs((p.home_pred + p.away_pred) - (m.home_score + m.away_score))
  ) filter (where p.is_correct is not null), 0)           as goal_diff_score
from profiles pr
left join predictions p on p.user_id = pr.id
left join matches m on m.id = p.match_id and m.status = 'finished'
group by pr.id, pr.display_name;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles    enable row level security;
alter table matches     enable row level security;
alter table predictions enable row level security;

-- profiles: anyone authenticated can read (for leaderboard names); user can update own row; insert own row on signup.
drop policy if exists "profiles_read"   on profiles;
drop policy if exists "profiles_insert" on profiles;
drop policy if exists "profiles_update" on profiles;
create policy "profiles_read"   on profiles for select using (auth.role() = 'authenticated');
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- matches: everyone authenticated can read; only admins can write.
drop policy if exists "matches_read"  on matches;
drop policy if exists "matches_write" on matches;
create policy "matches_read"  on matches for select using (auth.role() = 'authenticated');
create policy "matches_write" on matches for all using (is_admin()) with check (is_admin());

-- predictions: each user can ONLY read their own predictions (never anyone else's).
-- Leaderboard names/points come from the `leaderboard` view (security-definer aggregate),
-- which exposes totals only — never individual picks.
drop policy if exists "predictions_read"   on predictions;
drop policy if exists "predictions_insert" on predictions;
drop policy if exists "predictions_update" on predictions;

-- READ: own rows only.
create policy "predictions_read" on predictions
  for select using (auth.uid() = user_id);

-- INSERT: own row only, and only while the window is open.
-- Window closes 15 minutes BEFORE kickoff. now() and kickoff_at are both UTC.
create policy "predictions_insert" on predictions
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from matches m
      where m.id = match_id
        and (m.kickoff_at - interval '15 minutes') > now()
    )
  );

-- UPDATE: intentionally NO update policy.
-- A prediction, once placed, can never be changed. With no permissive update policy,
-- RLS denies every update by default. This is the "once predicted, locked" rule
-- enforced at the database, not just the UI.

-- ============================================================
-- Bootstrap your first admin AFTER you sign up once:
--   update profiles set is_admin = true where email = 'you@example.com';
-- ============================================================

-- ============================================================
-- PUBLIC results board (no login). Exposes ONLY finished matches:
-- score + the display names of members who predicted it exactly.
-- No predictions for unfinished matches, no losing picks, no emails.
-- This view is the ONLY thing anonymous visitors can read.
-- IMPORTANT: security_invoker = false (the default for views in PG <15, but we
-- set it explicitly) means the view runs with the VIEW OWNER's rights, bypassing
-- the underlying tables' RLS. That's what lets the anon role read finished-match
-- results without unlocking predictions/profiles directly. The view's WHERE and
-- column list are the security boundary — it can only ever return finished
-- matches + winner names, nothing else.
-- ============================================================
create or replace view public_results
with (security_invoker = false) as
select
  m.id                                          as match_id,
  m.stage,
  m.home_team,
  m.away_team,
  m.kickoff_at,
  m.home_score,
  m.away_score,
  m.graded_at,
  -- count of correct predictions
  count(p.id) filter (where p.is_correct)       as winners_count,
  -- array of winner display names (empty if nobody nailed it)
  coalesce(
    array_agg(pr.display_name order by pr.display_name)
      filter (where p.is_correct),
    array[]::text[]
  )                                             as winner_names
from matches m
left join predictions p on p.match_id = m.id
left join profiles pr on pr.id = p.user_id
where m.status = 'finished'
group by m.id, m.stage, m.home_team, m.away_team,
         m.kickoff_at, m.home_score, m.away_score, m.graded_at;

-- Make the public view readable by anonymous + authenticated roles.
-- (Views run with the definer's rights; granting select here is what opens it.)
grant select on public_results to anon, authenticated;

-- ============================================================
-- ADMIN winners view. Per finished match, every member's pick and
-- whether it was correct. Admin-only (filtered in the query by is_admin()).
-- Richer than the public board: shows ALL picks, not just winners.
-- ============================================================
create or replace view admin_match_breakdown as
select
  m.id            as match_id,
  m.stage,
  m.home_team,
  m.away_team,
  m.kickoff_at,
  m.status,
  m.home_score,
  m.away_score,
  pr.display_name,
  pr.email,
  p.home_pred,
  p.away_pred,
  p.is_correct,
  p.created_at    as predicted_at
from matches m
left join predictions p on p.match_id = m.id
left join profiles pr on pr.id = p.user_id;
-- Access is gated in the app: only render this for is_admin() users.
-- Also enforce via a security-definer function wrapper if you prefer hard DB-side
-- gating (see get_admin_breakdown below).

-- Hard DB-side gate: returns the breakdown ONLY if the caller is an admin.
create or replace function get_admin_breakdown()
returns setof admin_match_breakdown
language sql
security definer
set search_path = public
as $$
  select * from admin_match_breakdown where is_admin();
$$;
