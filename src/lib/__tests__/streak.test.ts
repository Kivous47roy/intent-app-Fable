import { describe, it, expect } from 'vitest';
import { nextStreak, type StreakState } from '../streak';

const s = (currentStreak: number, lastEntryDate: string | null, lastGraceDate: string | null = null): StreakState => ({
  currentStreak,
  lastEntryDate,
  lastGraceDate,
});

describe('streak recompute (stored-counter rules)', () => {
  it('first ever entry starts at 1', () => {
    expect(nextStreak(s(0, null), '2026-07-04').currentStreak).toBe(1);
  });

  it('consecutive days increment', () => {
    const r = nextStreak(s(5, '2026-07-03'), '2026-07-04');
    expect(r.currentStreak).toBe(6);
    expect(r.lastEntryDate).toBe('2026-07-04');
  });

  it('second ritual on the same day does not change the streak (1-of-5 rule)', () => {
    const r = nextStreak(s(6, '2026-07-04'), '2026-07-04');
    expect(r.currentStreak).toBe(6);
  });

  it('one missed day is bridged by a grace day', () => {
    const r = nextStreak(s(5, '2026-07-01'), '2026-07-03');
    expect(r.currentStreak).toBe(6);
    expect(r.lastGraceDate).toBe('2026-07-03');
  });

  it('grace is limited to once per 7 days', () => {
    // grace spent on 07-03; another 1-day gap on 07-05 → reset
    const r = nextStreak(s(6, '2026-07-03', '2026-07-03'), '2026-07-05');
    expect(r.currentStreak).toBe(1);
  });

  it('grace becomes available again after 7 days', () => {
    const r = nextStreak(s(9, '2026-07-10', '2026-07-03'), '2026-07-12');
    expect(r.currentStreak).toBe(10);
    expect(r.lastGraceDate).toBe('2026-07-12');
  });

  it('a 2-day break resets to 1', () => {
    const r = nextStreak(s(12, '2026-07-01'), '2026-07-04');
    expect(r.currentStreak).toBe(1);
  });

  it('backdated/out-of-order write leaves the streak untouched', () => {
    const r = nextStreak(s(4, '2026-07-04'), '2026-07-02');
    expect(r.currentStreak).toBe(4);
    expect(r.lastEntryDate).toBe('2026-07-04');
  });

  it('timezone edge: dates are compared as local calendar days across DST', () => {
    // DST spring-forward in most locales: Mar 8 → Mar 9 is a 23-hour day,
    // but still exactly 1 calendar day apart.
    const r = nextStreak(s(3, '2026-03-08'), '2026-03-09');
    expect(r.currentStreak).toBe(4);
  });
});
