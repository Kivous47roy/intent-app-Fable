'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// Timestamp-based elapsed-time timer (PRD decision 12). Stores a start
// timestamp and computes elapsed = now - start on each tick, so it is immune
// to background-tab throttling/drift — critical for the 30-minute Retrieval
// ritual, the one most likely to have the tab backgrounded or phone locked.

export interface TimerState {
  elapsedMs: number;
  running: boolean;
}

/** Pure helper (unit-tested): elapsed active ms given segments + now. */
export function computeElapsed(
  segments: { start: number; end: number | null }[],
  now: number
): number {
  return segments.reduce((sum, s) => sum + ((s.end ?? now) - s.start), 0);
}

export function useTimer(totalSeconds: number) {
  // Populated on mount (not during render — Date.now is impure in render)
  const segmentsRef = useRef<{ start: number; end: number | null }[]>([]);
  const [running, setRunning] = useState(true);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (segmentsRef.current.length === 0) {
      segmentsRef.current.push({ start: Date.now(), end: null });
    }
    const tick = () => setElapsedMs(computeElapsed(segmentsRef.current, Date.now()));
    tick();
    const t = setInterval(tick, 500);
    const onVisible = () => tick(); // instant catch-up on foreground
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const toggle = useCallback(() => {
    const segs = segmentsRef.current;
    if (segs.length === 0) return;
    const last = segs[segs.length - 1];
    if (last.end === null) {
      last.end = Date.now();
      setRunning(false);
    } else {
      segs.push({ start: Date.now(), end: null });
      setRunning(true);
    }
    setElapsedMs(computeElapsed(segs, Date.now()));
  }, []);

  const remaining = Math.max(0, totalSeconds - Math.floor(elapsedMs / 1000));
  const pct = Math.min(100, (elapsedMs / 1000 / totalSeconds) * 100);

  return { remaining, pct, running, toggle };
}

export function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
