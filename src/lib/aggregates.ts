import type { RitualType } from './rituals';

// Shapers for the grouped/aggregate queries behind the Diary month view and
// the Habit Log heatmap (PRD decision 6): the app issues ONE query per view
// over the date range and these pure functions shape the rows client-side.
// Query count stays constant regardless of habit count or days shown.

export interface EntryRow {
  id: string;
  ritual_type: RitualType;
  entry_date: string;
  content: unknown;
}

export type DiaryMonth = Map<string, EntryRow[]>; // entry_date -> entries

export function groupEntriesByDate(rows: EntryRow[]): DiaryMonth {
  const map: DiaryMonth = new Map();
  for (const row of rows) {
    const list = map.get(row.entry_date);
    if (list) list.push(row);
    else map.set(row.entry_date, [row]);
  }
  return map;
}

export interface HabitLogRow {
  habit_id: string;
  log_date: string;
  done: boolean;
}

/**
 * Shape habit_logs rows into a 28-cell row per habit.
 * Cell values: 1 = done, 0 = missed/unmarked, aligned oldest → newest,
 * ending at `endDate` (the user's local today).
 */
export function buildHeatmap(
  habitIds: string[],
  rows: HabitLogRow[],
  dayKeys: string[]
): Map<string, number[]> {
  const doneSet = new Set(
    rows.filter((r) => r.done).map((r) => `${r.habit_id}:${r.log_date}`)
  );
  const map = new Map<string, number[]>();
  for (const id of habitIds) {
    map.set(
      id,
      dayKeys.map((d) => (doneSet.has(`${id}:${d}`) ? 1 : 0))
    );
  }
  return map;
}
