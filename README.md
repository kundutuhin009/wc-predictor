# World Cup 2026 — Score Predictor

Predict the **exact scoreline** of every WC2026 match. 1 point per exact hit
(score at end of regular + extra time, **before penalties**). Email-OTP login,
predictions lock 15 minutes before kickoff and can never be edited, IST
everywhere, admin result entry with automatic grading, and a live leaderboard.

## Stack
Next.js 14 (App Router) · TypeScript · Tailwind · Supabase (`@supabase/ssr`,
email OTP) · `date-fns-tz` for IST display. Deploys to Vercel.

## 1. Set up the database (Supabase SQL editor)
Run these **in order**:

1. `db/schema.sql` — tables, RLS, grading trigger, `leaderboard` view.
2. `db/seed_matches.sql` — the 104 WC2026 fixtures.
3. `db/admin_stats.sql` — aggregate view that powers the "X correct" count on
   `/admin` (predictions RLS hides individual picks, so admin counts come from
   this counts-only view, exactly like `leaderboard`).

## 2. Local env
Fill `.env.local` with your project's values (Supabase → Project Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

In Supabase → **Authentication → Providers → Email**, enable email and ensure
email OTP is on (this app uses 6-digit codes, no magic link required). Set
**Authentication → URL Configuration → Site URL** to your local
(`http://localhost:3000`) and production URLs.

```
npm install
npm run dev
```

## 3. Make yourself admin
Sign in once (so your `profiles` row exists), then run in the SQL editor:

```sql
update profiles set is_admin = true where email = 'YOUR_EMAIL';
```

Reload `/admin` — you'll see the admin tools.

## Rules enforced
- **Lock:** predictions close at `kickoff − 15 min`. Enforced by the RLS insert
  policy **and** re-checked server-side against the server clock.
- **No edits:** the predictions table has no UPDATE policy — once placed, a pick
  is final at the database level. The UI never shows an edit form.
- **Privacy:** each user reads only their own predictions (RLS). The leaderboard
  exposes names + points only.
