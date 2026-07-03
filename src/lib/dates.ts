// entry_date uses the user's local device timezone (PRD decision 10).

export function localDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isoDotted(d: Date = new Date()): string {
  return localDateString(d).replaceAll('-', '.');
}

export function parseDateString(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Whole-day difference between two YYYY-MM-DD local dates (b - a). */
export function daysBetween(a: string, b: string): number {
  const da = parseDateString(a);
  const db = parseDateString(b);
  // Round to absorb DST shifts (a day can be 23 or 25 hours long)
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

export function addDays(s: string, n: number): string {
  const d = parseDateString(s);
  d.setDate(d.getDate() + n);
  return localDateString(d);
}

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function greeting(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
