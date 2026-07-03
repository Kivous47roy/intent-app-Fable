# Intent

Five short writing rituals. One quiet practice.

A mobile-first journaling PWA: five evidence-based writing rituals (Brain Dump, Gratitude, Expressive, Implementation Intention, Retrieval) plus a small daily habits checklist. Quiet by default, rewarding without being loud.

## Stack

- **Frontend:** Next.js (App Router) on Vercel
- **Backend:** Supabase (Postgres + Auth, magic-link sign-in)
- **Design:** ported from the "Gratitude Journal App" Claude Design project — warm paper palette, Fraunces/Newsreader/JetBrains Mono

## Architecture highlights

- **Local-first writes** — every draft and save lands in IndexedDB before any network call; the outbox flushes on reconnect/foreground with a visible retry affordance. No Background Sync API (unsupported on iOS Safari).
- **Stored streak counter** — recomputed transactionally with each entry insert via a Postgres function (`save_ritual_entry`): 1-of-5 rituals keeps the day, one grace day per week, 2-day break resets.
- **Schema-validated content** — per-ritual Zod schemas guard every write into the `jsonb` column.
- **RLS on all four tables** — `profiles`, `ritual_entries`, `habits` direct; `habit_logs` via join.
- **Timestamp-based timers** — immune to background-tab throttling (matters for the 30-min Retrieval ritual).
- **Constant query counts** — Diary month view and Habit Log heatmap are each one grouped range query.

## Development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project values
npm run dev
```

Apply `supabase/migrations/0001_init.sql` to your Supabase project (SQL editor or `supabase db push`).

## Tests

```bash
npm test   # Vitest: ritual schemas, streak/grace logic, timer, aggregates
```

## Environment

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (publishable) key |
| `NEXT_PUBLIC_POSTHOG_KEY` | optional — enables analytics events |
| `NEXT_PUBLIC_POSTHOG_HOST` | optional — PostHog host |
