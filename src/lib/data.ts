'use client';

import { createClient } from './supabase/client';
import { validateContent, type RitualContent } from './schemas';
import type { RitualType } from './rituals';
import { DEFAULT_HABITS } from './rituals';
import { localDateString } from './dates';
import {
  enqueueSave,
  listOutbox,
  removeFromOutbox,
  bumpAttempts,
  clearDraft,
} from './localStore';
import { track } from './analytics';
import type { Profile, Habit } from './types';
import type { EntryRow, HabitLogRow } from './aggregates';

const supabase = () => createClient();

// ─── Profile ────────────────────────────────────────────────────────

export async function getProfile(): Promise<Profile | null> {
  const { data, error } = await supabase().from('profiles').select('*').maybeSingle();
  if (error) throw error;
  return data;
}

export async function createProfile(name: string, reminderTime: string, reminderEnabled: boolean) {
  const sb = supabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { error } = await sb.from('profiles').upsert({
    user_id: user.id,
    name,
    reminder_time: reminderTime,
    reminder_enabled: reminderEnabled,
  });
  if (error) throw error;

  // Seed starter habits once
  const { count } = await sb.from('habits').select('id', { count: 'exact', head: true });
  if (!count) {
    const { error: hErr } = await sb.from('habits').insert(
      DEFAULT_HABITS.map((h, i) => ({ ...h, user_id: user.id, sort_order: i }))
    );
    if (hErr) throw hErr;
  }
}

export async function updateProfile(patch: Partial<Pick<Profile, 'name' | 'reminder_time' | 'reminder_enabled'>>) {
  const sb = supabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error('Not signed in');
  const { error } = await sb.from('profiles').update(patch).eq('user_id', user.id);
  if (error) throw error;
}

// ─── Ritual entries: local-first save path ──────────────────────────

export type SaveResult = { status: 'synced' } | { status: 'queued' } | { status: 'invalid'; error: string };

/**
 * The single write path for ritual entries (PRD decisions 2, 3, 4):
 * 1. Zod-validate per ritual_type — nothing malformed is ever written.
 * 2. Enqueue in the IndexedDB outbox BEFORE any network call.
 * 3. Attempt the network write (RPC save_ritual_entry: insert + streak
 *    recompute in one transaction). On success, dequeue + clear draft.
 *    On failure the item stays queued — the caller shows a visible,
 *    non-blocking retry affordance; the draft is never destroyed.
 */
export async function saveRitualEntry(
  ritualType: RitualType,
  content: unknown,
  entryDate: string = localDateString()
): Promise<SaveResult> {
  const validated = validateContent(ritualType, content);
  if (!validated.ok) return { status: 'invalid', error: validated.error };

  await enqueueSave({
    key: `${entryDate}:${ritualType}`,
    entryDate,
    ritualType,
    content: validated.content,
  });

  const flushed = await flushOutbox();
  return flushed ? { status: 'synced' } : { status: 'queued' };
}

let flushing = false;

/** Push every queued write to Supabase. Returns true if the outbox is empty after the pass. */
export async function flushOutbox(): Promise<boolean> {
  if (flushing) return false;
  flushing = true;
  try {
    const items = await listOutbox();
    let allOk = true;
    for (const item of items) {
      const { error } = await supabase().rpc('save_ritual_entry', {
        p_ritual_type: item.ritualType,
        p_entry_date: item.entryDate,
        p_content: item.content,
      });
      if (error) {
        await bumpAttempts(item.key);
        allOk = false;
      } else {
        await removeFromOutbox(item.key);
        await clearDraft(item.entryDate, item.ritualType);
        track('ritual_completed', { ritual_type: item.ritualType });
      }
    }
    return allOk;
  } finally {
    flushing = false;
  }
}

export async function pendingCount(): Promise<number> {
  return (await listOutbox()).length;
}

// ─── Reads (grouped/aggregate — constant query count per view) ──────

export async function getEntriesForRange(from: string, to: string): Promise<EntryRow[]> {
  const { data, error } = await supabase()
    .from('ritual_entries')
    .select('id, ritual_type, entry_date, content')
    .gte('entry_date', from)
    .lte('entry_date', to)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as EntryRow[];
}

export async function getTodayCompletion(): Promise<Set<RitualType>> {
  const today = localDateString();
  const rows = await getEntriesForRange(today, today);
  return new Set(rows.map((r) => r.ritual_type));
}

export async function getAllEntries() {
  const { data, error } = await supabase()
    .from('ritual_entries')
    .select('ritual_type, entry_date, content, created_at')
    .order('entry_date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as { ritual_type: RitualType; entry_date: string; content: RitualContent; created_at: string }[];
}

// ─── Habits ─────────────────────────────────────────────────────────

export async function getHabits(): Promise<Habit[]> {
  const { data, error } = await supabase()
    .from('habits')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addHabit(title: string, emoji: string, accent: string, sortOrder: number) {
  const sb = supabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error('Not signed in');
  const { error } = await sb
    .from('habits')
    .insert({ user_id: user.id, title, emoji, accent, sort_order: sortOrder });
  if (error) throw error;
}

export async function deleteHabit(id: string) {
  const { error } = await supabase().from('habits').delete().eq('id', id);
  if (error) throw error;
}

export async function getHabitLogs(from: string, to: string): Promise<HabitLogRow[]> {
  // Single range query joined through habits via RLS; constant query count
  const { data, error } = await supabase()
    .from('habit_logs')
    .select('habit_id, log_date, done')
    .gte('log_date', from)
    .lte('log_date', to);
  if (error) throw error;
  return (data ?? []) as HabitLogRow[];
}

export async function setHabitDone(habitId: string, logDate: string, done: boolean) {
  const { error } = await supabase()
    .from('habit_logs')
    .upsert({ habit_id: habitId, log_date: logDate, done }, { onConflict: 'habit_id,log_date' });
  if (error) throw error;
}
