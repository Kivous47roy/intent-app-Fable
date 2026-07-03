import type { RitualType } from './rituals';
import type { RitualContent } from './schemas';

export interface Profile {
  user_id: string;
  name: string | null;
  reminder_time: string | null;
  reminder_enabled: boolean;
  current_streak: number;
  last_entry_date: string | null;
  last_grace_date: string | null;
  created_at: string;
}

export interface RitualEntry {
  id: string;
  user_id: string;
  ritual_type: RitualType;
  entry_date: string; // YYYY-MM-DD (user's local date at write time)
  content: RitualContent;
  created_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  emoji: string;
  accent: string;
  sort_order: number;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  log_date: string;
  done: boolean;
}
