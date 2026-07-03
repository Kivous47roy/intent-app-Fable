'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RITUALS, type RitualType } from '@/lib/rituals';
import { getProfile, getTodayCompletion, getHabits, getHabitLogs, setHabitDone } from '@/lib/data';
import { localDateString, isoDotted, greeting, WEEKDAYS, MONTHS } from '@/lib/dates';
import { Icon, type GlyphName } from '@/components/icons';
import { Pattern } from '@/components/Pattern';
import { BottomNav } from '@/components/BottomNav';
import { InstallPrompt } from '@/components/InstallPrompt';
import { ScreenLoading } from '@/components/ScreenLoading';
import type { Habit, Profile } from '@/lib/types';

export default function TodayPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [completed, setCompleted] = useState<Set<RitualType>>(new Set());
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitsDone, setHabitsDone] = useState<Set<string>>(new Set());
  const [habitsOpen, setHabitsOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const today = localDateString();
      const [p, done, hs, logs] = await Promise.all([
        getProfile(),
        getTodayCompletion(),
        getHabits(),
        getHabitLogs(localDateString(), localDateString()),
      ]);
      if (!p) {
        router.replace('/onboarding');
        return;
      }
      setProfile(p);
      setCompleted(done);
      setHabits(hs);
      setHabitsDone(new Set(logs.filter((l) => l.done && l.log_date === today).map((l) => l.habit_id)));
      setLoaded(true);
    } catch {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleHabit = async (id: string) => {
    const today = localDateString();
    const next = new Set(habitsDone);
    const nowDone = !next.has(id);
    if (nowDone) next.add(id);
    else next.delete(id);
    setHabitsDone(next); // optimistic
    try {
      await setHabitDone(id, today, nowDone);
    } catch {
      setHabitsDone(habitsDone); // revert on failure
    }
  };

  const now = new Date();
  const dateLabel = `${MONTHS[now.getMonth()]} ${now.getDate()}`;

  if (!loaded) return <ScreenLoading label="TODAY" />;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 2 }}>
      <div style={{ height: 'max(40px, env(safe-area-inset-top))' }} />

      {/* Header band */}
      <div style={{ padding: '16px 24px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 18 }}>
          <div className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--ink-3)' }}>
            INTENT
          </div>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            {isoDotted(now)}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div className="serif" style={{ fontSize: 14, color: 'var(--ink-2)', fontStyle: 'italic' }}>
              {greeting(now)}, {profile?.name}.
            </div>
            <div className="display" style={{ fontSize: 38, lineHeight: 1.05, fontWeight: 300, marginTop: 4 }}>
              {WEEKDAYS[now.getDay()]}
              <span style={{ color: 'var(--ink-3)' }}>,</span>
              <br />
              <em style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 400 }}>{dateLabel}.</em>
            </div>
          </div>

          {/* Streak coin — the app's one celebratory element */}
          <div
            style={{
              border: '1px solid var(--ink)',
              borderRadius: 999,
              padding: '10px 14px 10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--paper-2)',
            }}
          >
            <span style={{ color: 'var(--accent)' }}>
              <Icon.Flame size={16} />
            </span>
            <span className="display" style={{ fontSize: 22, fontWeight: 400, lineHeight: 1 }}>
              {profile?.current_streak ?? 0}
            </span>
            <span className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-2)' }}>
              DAYS
            </span>
          </div>
        </div>
      </div>

      {/* Subhead */}
      <div style={{ padding: '20px 24px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--ink-3)' }}>
          ── TODAY’S RITUALS · {completed.size} / 5
        </div>
        <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
      </div>

      {/* Cards */}
      <div style={{ flex: 1, padding: '4px 24px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Habits tile */}
          <button
            onClick={() => setHabitsOpen((o) => !o)}
            className="card-tile"
            style={{
              position: 'relative',
              display: 'block',
              textAlign: 'left',
              background: 'var(--card)',
              border: '1px solid var(--line-strong)',
              borderRadius: 4,
              padding: '14px 16px',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 4,
                  flexShrink: 0,
                  border: '1px solid var(--ink)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--paper)',
                  color: 'var(--ink)',
                }}
              >
                <Icon.Habit size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="serif" style={{ fontSize: 19, fontWeight: 500, lineHeight: 1.1 }}>
                  Habits
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 3 }}>
                  {habitsDone.size} of {habits.length} kept · tap to mark
                </div>
              </div>
              <div style={{ color: 'var(--ink-3)', transform: habitsOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                <Icon.ChevR size={16} />
              </div>
            </div>

            {habitsOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 6 }}
              >
                {habits.map((h) => {
                  const isDone = habitsDone.has(h.id);
                  return (
                    <div
                      key={h.id}
                      role="button"
                      onClick={() => toggleHabit(h.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', cursor: 'pointer' }}
                    >
                      <div
                        style={{
                          width: 22,
                          height: 22,
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
                        {isDone && <Icon.Check size={11} stroke={2.6} />}
                      </div>
                      <span style={{ fontSize: 16 }}>{h.emoji}</span>
                      <span
                        className="serif"
                        style={{
                          fontSize: 14,
                          textDecoration: isDone ? 'line-through' : 'none',
                          color: isDone ? 'var(--ink-3)' : 'var(--ink)',
                          flex: 1,
                        }}
                      >
                        {h.title}
                      </span>
                    </div>
                  );
                })}
                <Link
                  href="/habits"
                  onClick={(e) => e.stopPropagation()}
                  className="mono"
                  style={{
                    marginTop: 6,
                    padding: '8px 0',
                    borderTop: '1px solid var(--line)',
                    fontSize: 11,
                    letterSpacing: '0.12em',
                    color: 'var(--ink-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textDecoration: 'none',
                  }}
                >
                  <span>OPEN FULL CHECK-IN</span>
                  <Icon.Arrow size={14} />
                </Link>
              </div>
            )}
          </button>

          {/* Ritual cards */}
          {RITUALS.map((j, i) => {
            const Glyph = Icon[j.glyph as GlyphName];
            const done = completed.has(j.id);
            return (
              <Link
                key={j.id}
                href={`/ritual/${j.id}`}
                className="card-tile"
                style={{
                  position: 'relative',
                  display: 'block',
                  textAlign: 'left',
                  background: done ? 'var(--paper-2)' : 'var(--card)',
                  border: `1px solid ${done ? 'var(--line)' : 'var(--line-strong)'}`,
                  borderRadius: 4,
                  padding: '16px 18px',
                  overflow: 'hidden',
                  opacity: done ? 0.7 : 1,
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <Pattern kind={j.pattern} color={j.accent} />
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 4,
                      flexShrink: 0,
                      border: '1px solid var(--ink)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--paper)',
                      color: j.accent,
                    }}
                  >
                    <Glyph size={24} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <div className="serif" style={{ fontSize: 19, fontWeight: 500, lineHeight: 1.1 }}>
                        {j.title}
                      </div>
                      <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>
                        {String(i + 1).padStart(2, '0')}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 3, lineHeight: 1.3 }}>
                      {j.blurb}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    {done ? (
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 999,
                          background: 'var(--ink)',
                          color: 'var(--paper)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon.Check size={14} stroke={2.4} />
                      </div>
                    ) : (
                      <div
                        className="mono"
                        style={{
                          fontSize: 11,
                          letterSpacing: '0.05em',
                          padding: '3px 8px',
                          border: '1px solid var(--line-strong)',
                          borderRadius: 999,
                          color: 'var(--ink-2)',
                        }}
                      >
                        {j.minutes} MIN
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div style={{ marginTop: 24, padding: '20px 6px', borderTop: '1px solid var(--line)' }}>
          <div className="serif" style={{ fontSize: 15, fontStyle: 'italic', color: 'var(--ink-2)', lineHeight: 1.45 }}>
            “The faintest ink is more durable than the strongest memory.”
          </div>
          <div className="mono" style={{ fontSize: 10, marginTop: 10, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>
            — CHINESE PROVERB
          </div>
        </div>
      </div>

      <InstallPrompt />
      <BottomNav active="today" />
    </div>
  );
}
