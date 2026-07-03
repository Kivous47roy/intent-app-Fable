'use client';

// Habit Log — 28-day heatmap (PRD §3.4, decision 6: one grouped range query,
// query count constant regardless of habit count).
import { useEffect, useState } from 'react';
import { getHabits, getHabitLogs } from '@/lib/data';
import { buildHeatmap } from '@/lib/aggregates';
import { localDateString, addDays } from '@/lib/dates';
import { BottomNav } from '@/components/BottomNav';
import { ScreenLoading } from '@/components/ScreenLoading';
import type { Habit } from '@/lib/types';

const DAYS = 28;

export default function HabitLogPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [heatmap, setHeatmap] = useState<Map<string, number[]>>(new Map());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const today = localDateString();
    const from = addDays(today, -(DAYS - 1));
    const dayKeys = Array.from({ length: DAYS }, (_, i) => addDays(from, i));
    Promise.all([getHabits(), getHabitLogs(from, today)])
      .then(([hs, logs]) => {
        setHabits(hs);
        setHeatmap(buildHeatmap(hs.map((h) => h.id), logs, dayKeys));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded) return <ScreenLoading label="HABIT LOG" />;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 2 }}>
      <div style={{ height: 'max(40px, env(safe-area-inset-top))' }} />

      <div style={{ padding: '16px 24px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
          <div className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--ink-3)' }}>
            HABITS · LOG
          </div>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>28 D</div>
        </div>
        <h1 className="display" style={{ fontSize: 28, lineHeight: 1.05, fontWeight: 300, margin: 0 }}>
          A month of <em style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 400 }}>small</em> things.
        </h1>
      </div>

      <div style={{ flex: 1, padding: '20px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {habits.length === 0 && (
            <div className="serif" style={{ fontStyle: 'italic', color: 'var(--ink-3)', fontSize: 14 }}>
              No habits yet — add some from the Habits page.
            </div>
          )}
          {habits.map((h) => {
            const row = heatmap.get(h.id) ?? [];
            const completed = row.filter((x) => x === 1).length;
            return (
              <div key={h.id}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 16 }}>{h.emoji}</span>
                  <div className="serif" style={{ fontSize: 15, fontWeight: 500 }}>{h.title}</div>
                  <div style={{ flex: 1 }} />
                  <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.08em' }}>
                    {completed}/{DAYS} · {Math.round((completed / DAYS) * 100)}%
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${DAYS}, 1fr)`, gap: 2 }}>
                  {row.map((v, i) => (
                    <div
                      key={i}
                      style={{
                        aspectRatio: '1',
                        background: v === 1 ? h.accent : 'transparent',
                        border: '1px solid ' + (v === 1 ? h.accent : 'var(--line)'),
                        borderRadius: 1,
                        opacity: v === 1 ? 0.85 : 0.4,
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {habits.length > 0 && (
          <div style={{ marginTop: 28, paddingTop: 16, borderTop: '1px solid var(--line)', display: 'flex', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--ink-3)', opacity: 0.85 }} />
              <span className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>KEPT</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, border: '1px solid var(--line)', opacity: 0.6 }} />
              <span className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>NOT YET</span>
            </div>
          </div>
        )}
      </div>

      <BottomNav active="habit-log" />
    </div>
  );
}
