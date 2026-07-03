-- Intent — initial schema (PRD §5, decisions 1, 9, 11)

create table public.profiles (
  user_id           uuid primary key references auth.users on delete cascade,
  name              text,
  reminder_time     time,
  reminder_enabled  boolean not null default false,
  current_streak    integer not null default 0,  -- stored counter, recomputed transactionally on each entry insert
  last_entry_date   date,
  last_grace_date   date,                        -- when the 1-per-week grace day was last spent
  created_at        timestamptz not null default now()
);

create table public.ritual_entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  ritual_type  text not null check (ritual_type in ('brain_dump','gratitude','expressive','intention','retrieval')),
  entry_date   date not null,                    -- user's LOCAL date at write time (decision 10)
  content      jsonb not null,                   -- schema-validated per ritual_type at the write boundary (decision 2)
  created_at   timestamptz not null default now(),
  unique (user_id, entry_date, ritual_type)      -- explicit: prevents duplicate writes corrupting the streak recompute (decision 9)
);

create table public.habits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  title       text not null,
  emoji       text not null default '✦',
  accent      text not null,
  sort_order  integer not null default 0
);

create table public.habit_logs (
  id        uuid primary key default gen_random_uuid(),
  habit_id  uuid not null references public.habits on delete cascade,
  log_date  date not null,
  done      boolean not null default false,
  unique (habit_id, log_date)
);

-- Indexes backing the grouped aggregate queries (decision 6)
create index ritual_entries_user_date_idx on public.ritual_entries (user_id, entry_date);
create index habit_logs_habit_date_idx on public.habit_logs (habit_id, log_date);

-- ─── Row Level Security: mandatory on all 4 tables (decision 11) ─────

alter table public.profiles enable row level security;
alter table public.ritual_entries enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;

create policy "own profile" on public.profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own entries" on public.ritual_entries
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own habits" on public.habits
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- habit_logs are scoped via a join to habits.user_id
create policy "own habit logs" on public.habit_logs
  for all using (
    exists (select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid())
  );

-- ─── save_ritual_entry: entry insert + streak recompute, one transaction ──
--
-- Streak rules (decisions 1, 9 + §10):
--   ≥1 ritual/day keeps the day; +1 for consecutive days; a single missed
--   day is bridged by a grace day at most once per 7 days; otherwise reset
--   to 1. Duplicate same-day/same-type writes update content and leave the
--   streak untouched.
create or replace function public.save_ritual_entry(
  p_ritual_type text,
  p_entry_date  date,
  p_content     jsonb
) returns void
language plpgsql
security invoker
as $$
declare
  v_user uuid := auth.uid();
  v_inserted boolean;
  v_last date;
  v_grace date;
  v_streak integer;
  v_gap integer;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  insert into public.ritual_entries (user_id, ritual_type, entry_date, content)
  values (v_user, p_ritual_type, p_entry_date, p_content)
  on conflict (user_id, entry_date, ritual_type)
  do update set content = excluded.content
  returning (xmax = 0) into v_inserted;

  if not v_inserted then
    return; -- content updated; streak unchanged
  end if;

  select current_streak, last_entry_date, last_grace_date
    into v_streak, v_last, v_grace
    from public.profiles where user_id = v_user for update;

  if not found then
    insert into public.profiles (user_id, current_streak, last_entry_date)
    values (v_user, 1, p_entry_date);
    return;
  end if;

  if v_last is null then
    v_streak := 1; v_last := p_entry_date;
  else
    v_gap := p_entry_date - v_last;
    if v_gap <= 0 then
      return; -- same day or backdated: no change
    elsif v_gap = 1 then
      v_streak := v_streak + 1; v_last := p_entry_date;
    elsif v_gap = 2 and (v_grace is null or p_entry_date - v_grace >= 7) then
      v_streak := v_streak + 1; v_last := p_entry_date; v_grace := p_entry_date;
    else
      v_streak := 1; v_last := p_entry_date;
    end if;
  end if;

  update public.profiles
    set current_streak = v_streak, last_entry_date = v_last, last_grace_date = v_grace
    where user_id = v_user;
end;
$$;
