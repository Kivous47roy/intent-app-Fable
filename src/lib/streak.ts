import { daysBetween } from './dates';

// Streak rules (PRD decisions 1 & 9 + §10 test spec):
// - ≥1 completed ritual in a local day counts as that day kept
// - consecutive days extend the streak
// - a single missed day is bridged by a grace day, at most once per 7 days
// - a 2+ day break (or an unavailable grace) resets the streak to 1
//
// The streak is a stored counter on profiles, recomputed in the same
// transaction as each ritual_entries insert. This TS mirror of the SQL
// function exists for unit tests and optimistic UI.

export interface StreakState {
  currentStreak: number;
  lastEntryDate: string | null; // YYYY-MM-DD local
  lastGraceDate: string | null; // YYYY-MM-DD local, when a grace day was last spent
}

export function nextStreak(state: StreakState, entryDate: string): StreakState {
  const { currentStreak, lastEntryDate, lastGraceDate } = state;

  if (!lastEntryDate) {
    return { currentStreak: 1, lastEntryDate: entryDate, lastGraceDate };
  }

  const gap = daysBetween(lastEntryDate, entryDate);

  // Same day (another ritual today) or an out-of-order/backdated write: no change
  if (gap <= 0) return state;

  if (gap === 1) {
    return { currentStreak: currentStreak + 1, lastEntryDate: entryDate, lastGraceDate };
  }

  if (gap === 2) {
    const graceAvailable = !lastGraceDate || daysBetween(lastGraceDate, entryDate) >= 7;
    if (graceAvailable) {
      return {
        currentStreak: currentStreak + 1,
        lastEntryDate: entryDate,
        lastGraceDate: entryDate,
      };
    }
  }

  // 2-day break (without grace) or longer: reset
  return { currentStreak: 1, lastEntryDate: entryDate, lastGraceDate };
}
