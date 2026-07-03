import { describe, it, expect } from 'vitest';
import { computeElapsed, fmtTime } from '../../hooks/useTimer';

describe('timestamp-based timer', () => {
  it('computes elapsed from a running segment', () => {
    const t0 = 1_000_000;
    expect(computeElapsed([{ start: t0, end: null }], t0 + 90_000)).toBe(90_000);
  });

  it('survives a background gap: elapsed jumps to true wall-clock time', () => {
    // Simulates a tab backgrounded for 10 minutes with zero ticks fired —
    // elapsed must reflect wall-clock, not tick count.
    const t0 = 1_000_000;
    const now = t0 + 10 * 60_000;
    expect(computeElapsed([{ start: t0, end: null }], now)).toBe(600_000);
  });

  it('pause segments exclude paused time', () => {
    const t0 = 1_000_000;
    const segments = [
      { start: t0, end: t0 + 60_000 }, // ran 1 min
      { start: t0 + 120_000, end: null }, // paused 1 min, resumed
    ];
    expect(computeElapsed(segments, t0 + 150_000)).toBe(90_000);
  });

  it('formats MM:SS', () => {
    expect(fmtTime(0)).toBe('00:00');
    expect(fmtTime(65)).toBe('01:05');
    expect(fmtTime(1800)).toBe('30:00');
  });
});
