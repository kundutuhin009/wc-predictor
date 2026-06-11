-- ============================================================
-- Admin per-match prediction stats.
-- Run AFTER schema.sql (and any time; it's idempotent).
--
-- Why this exists: the predictions table RLS lets a user read ONLY their own
-- rows — even admins can't read everyone's picks directly. This view is an
-- aggregate (counts only, never individual picks), and like the `leaderboard`
-- view it runs with the owner's privileges, so the /admin "X correct" count
-- works without weakening the per-user read policy on predictions.
-- It exposes COUNTS per match only — never who predicted what.
-- ============================================================

create or replace view match_prediction_stats as
select
  m.id                                            as match_id,
  count(p.id)                                     as prediction_count,
  count(p.id) filter (where p.is_correct)         as correct_count
from matches m
left join predictions p on p.match_id = m.id
group by m.id;

grant select on match_prediction_stats to authenticated;
