'use client';

// Habits — full check-in page (PRD §3.3) + lightweight manage (add/remove).
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getHabits, getHabitLogs, setHabitDone, addHabit, deleteHabit } from '@/lib/data';
import { localDateString } from '@/lib/dates';
import { HABIT_ACCENTS } from '@/lib/rituals';
import { Icon } from '@/components/icons';
import { BottomNav } from '@/components/BottomNav';
import { ScreenLoading } from '@/components/ScreenLoading';
import type { Habit } from '@/lib/types';

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [managing, setManaging] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const today = localDateString();
    const [hs, logs] = await Promise.all([getHabits(), getHabitLogs(today, today)]);
    setHabits(hs);
    setDone(new Set(logs.filter((l) => l.done).map((l) => l.habit_id)));
    setLoaded(true);
  };

  useEffect(() => {
    load().catch(() => setError('Could not load habits'));
  }, []);

  const toggle = async (id: string) => {
    const today = localDateString();
    const next = new Set(done);
    const nowDone = !next.has(id);
    if (nowDone) next.add(id);
    else next.delete(id);
    setDone(next);
    try {
      await setHabitDone(id, today, nowDone);
    } catch {
      setDone(done);
      setError('Couldn’t save that — tap to retry');
    }
  };

  const add = async () => {
    const title = draft.trim();
    if (!title) return;
    setDraft('');
    try {
      await addHabit(title, '✦', HABIT_ACCENTS[habits.length % HABIT_ACCENTS.length], habits.length);
      await load();
    } catch {
      setError('Couldn’t add habit');
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteHabit(id);
      await load();
    } catch {
      setError('Couldn’t remove habit');
    }
  };

  if (!loaded) return <ScreenLoading label="HABITS" />;

  const count = habits.filter((h) => done.has(h.id)).length;
  const total = habits.length;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 2 }}>
      <div style={{ height: 'max(40px, env(safe-area-inset-top))' }} />

      <div style={{ padding: '16px 24px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
          <div className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--ink-3)' }}>
            HABITS · TONIGHT
          </div>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            {count} / {total}
          </div>
          <Link
            href="/habit-log"
            className="mono"
            style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-2)', textDecoration: 'underline', textUnderlineOffset: 3 }}
          >
            LOG ↗
          </Link>
        </div>
        <h1 className="display" style={{ fontSize: 30, lineHeight: 1.05, fontWeight: 300, margin: 0 }}>
          What did today
          <br />
          <em style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 400 }}>actually</em> hold?
        </h1>

        <div style={{ marginTop: 16, height: 3, background: 'var(--line)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: total ? `${(count / total) * 100}%` : '0%', background: 'var(--ink)', transition: 'width 0.3s' }} />
        </div>
      </div>

      <div style={{ flex: 1, padding: '20px 24px' }}>
        {error && (
          <button onClick={() => { setError(null); load(); }} className="mono" style={{ fontSize: 11, color: 'var(--accent)', marginBottom: 12, display: 'block' }}>
            {error}
          </button>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {habits.map((h) => {
            const isDone = done.has(h.id);
            return (
              <div
                key={h.id}
                className="card-tile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  border: '1px solid ' + (isDone ? 'var(--ink)' : 'var(--line-strong)'),
                  borderRadius: 4,
                  background: isDone ? 'var(--paper-2)' : 'var(--card)',
                }}
              >
                <button
                  onClick={() => toggle(h.id)}
                  aria-label={isDone ? `Unmark ${h.title}` : `Mark ${h.title} done`}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, textAlign: 'left' }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      border: '1.5px solid ' + (isDone ? 'var(--ink)' : 'var(--line-strong)'),
                      background: isDone ? 'var(--ink)' : 'transparent',
                      color: 'var(--paper)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isDone && <Icon.Check size={14} stroke={2.6} />}
                  </div>
                  <div style={{ fontSize: 22 }}>{h.emoji}</div>
                  <div
                    className="serif"
                    style={{
                      fontSize: 17,
                      fontWeight: 500,
                      textDecoration: isDone ? 'line-through' : 'none',
                      color: isDone ? 'var(--ink-3)' : 'var(--ink)',
                      flex: 1,
                    }}
                  >
                    {h.title}
                  </div>
                </button>
                {managing && (
                  <button onClick={() => remove(h.id)} aria-label={`Delete ${h.title}`} style={{ color: 'var(--ink-3)' }}>
                    <Icon.X size={16} />
                  </button>
                )}
              </div>
            );
          })}

          {managing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px dashed var(--line-strong)', borderRadius: 4 }}>
              <div style={{ fontSize: 22 }}>✦</div>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && add()}
                placeholder="meditate 10 min, journal 1 page…"
                className="serif"
                style={{ fontSize: 16, fontWeight: 500, padding: 0, flex: 1 }}
              />
              <button onClick={add} className="mono" style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.08em' }}>
                SAVE
              </button>
            </div>
          )}

          <button
            onClick={() => setManaging((m) => !m)}
            className="mono"
            style={{ marginTop: 4, padding: '10px 0', fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-3)' }}
          >
            {managing ? 'DONE EDITING' : 'EDIT LIST'}
          </button>
        </div>

        {total > 0 && count === total && (
          <div style={{ marginTop: 22, padding: '14px 16px', border: '1px solid var(--ink)', borderRadius: 4, background: 'var(--paper-2)' }}>
            <div className="serif" style={{ fontStyle: 'italic', fontSize: 14, lineHeight: 1.5 }}>
              All {total}, today. A small day, well kept.
            </div>
          </div>
        )}
      </div>

      <BottomNav active="habits" />
    </div>
  );
}
