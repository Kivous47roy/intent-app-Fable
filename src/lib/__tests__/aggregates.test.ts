import { describe, it, expect } from 'vitest';
import { groupEntriesByDate, buildHeatmap } from '../aggregates';

describe('aggregate query shaping', () => {
  it('groups a month of entries by date in one pass', () => {
    const rows = [
      { id: '1', ritual_type: 'gratitude' as const, entry_date: '2026-07-01', content: {} },
      { id: '2', ritual_type: 'brain_dump' as const, entry_date: '2026-07-01', content: {} },
      { id: '3', ritual_type: 'expressive' as const, entry_date: '2026-07-03', content: {} },
    ];
    const grouped = groupEntriesByDate(rows);
    expect(grouped.get('2026-07-01')).toHaveLength(2);
    expect(grouped.get('2026-07-03')).toHaveLength(1);
    expect(grouped.get('2026-07-02')).toBeUndefined();
  });

  it('builds a 28-cell heatmap row per habit from one range query', () => {
    const days = ['2026-07-01', '2026-07-02', '2026-07-03'];
    const rows = [
      { habit_id: 'a', log_date: '2026-07-01', done: true },
      { habit_id: 'a', log_date: '2026-07-02', done: false },
      { habit_id: 'b', log_date: '2026-07-03', done: true },
    ];
    const map = buildHeatmap(['a', 'b'], rows, days);
    expect(map.get('a')).toEqual([1, 0, 0]);
    expect(map.get('b')).toEqual([0, 0, 1]);
  });

  it('habit with no logs gets an all-empty row (no per-habit query needed)', () => {
    const map = buildHeatmap(['x'], [], ['2026-07-01', '2026-07-02']);
    expect(map.get('x')).toEqual([0, 0]);
  });
});
