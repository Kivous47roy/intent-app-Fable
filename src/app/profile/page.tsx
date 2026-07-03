'use client';

// Profile — avatar, stats, reminder UI (not wired — delivery deferred, PRD §6),
// data export as text/JSON (decision 5), sign out.
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getProfile, updateProfile, getAllEntries } from '@/lib/data';
import { wordCount, contentExcerpt, type RitualContent } from '@/lib/schemas';
import { ritualById } from '@/lib/rituals';
import { MONTHS } from '@/lib/dates';
import { Icon } from '@/components/icons';
import { BottomNav } from '@/components/BottomNav';
import { ScreenLoading } from '@/components/ScreenLoading';
import type { Profile } from '@/lib/types';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<{ entries: number; words: number } | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    getProfile()
      .then((p) => {
        if (!p) router.replace('/onboarding');
        else setProfile(p);
      })
      .catch(() => router.replace('/login'));
    getAllEntries()
      .then((rows) => {
        setStats({
          entries: rows.length,
          words: rows.reduce((sum, r) => sum + wordCount(r.content), 0),
        });
      })
      .catch(() => setStats({ entries: 0, words: 0 }));
  }, [router]);

  const toggleReminder = async () => {
    if (!profile) return;
    const next = { ...profile, reminder_enabled: !profile.reminder_enabled };
    setProfile(next);
    try {
      await updateProfile({ reminder_enabled: next.reminder_enabled });
    } catch {
      setProfile(profile);
    }
  };

  const setReminderTime = async (time: string) => {
    if (!profile) return;
    const next = { ...profile, reminder_time: time };
    setProfile(next);
    try {
      await updateProfile({ reminder_time: time });
    } catch {
      setProfile(profile);
    }
  };

  const doExport = async (format: 'json' | 'txt') => {
    if (exporting) return;
    setExporting(true);
    try {
      const rows = await getAllEntries();
      let blob: Blob;
      let filename: string;
      if (format === 'json') {
        blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
        filename = 'intent-entries.json';
      } else {
        const text = rows
          .map((r) => {
            const j = ritualById(r.ritual_type);
            return `${r.entry_date} — ${j?.title ?? r.ritual_type}\n${contentExcerpt(r.content as RitualContent, 100_000)}\n`;
          })
          .join('\n');
        blob = new Blob([text], { type: 'text/plain' });
        filename = 'intent-entries.txt';
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const signOut = async () => {
    await createClient().auth.signOut();
    router.replace('/login');
  };

  if (!profile) return <ScreenLoading label="PROFILE" />;

  const joined = new Date(profile.created_at);
  const reminderTime = (profile.reminder_time ?? '07:30').slice(0, 5);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 2 }}>
      <div style={{ height: 'max(40px, env(safe-area-inset-top))' }} />

      <div style={{ padding: '16px 24px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
          <div className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--ink-3)' }}>PROFILE</div>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>v1.0</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              background: 'var(--paper-3)',
              border: '1px solid var(--ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span className="display" style={{ fontSize: 28, fontWeight: 400, fontStyle: 'italic' }}>
              {(profile.name || 'F').charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="display" style={{ fontSize: 28, lineHeight: 1.05, fontWeight: 300 }}>{profile.name}</div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4, letterSpacing: '0.08em' }}>
              JOINED · {MONTHS[joined.getMonth()].toUpperCase()} {joined.getFullYear()}
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '20px 24px' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.12em', marginBottom: 8 }}>
          ── PRACTICE
        </div>
        <div style={{ border: '1px solid var(--line-strong)', borderRadius: 4, overflow: 'hidden', background: 'rgba(255,255,255,0.4)', marginBottom: 22 }}>
          {[
            { l: 'Current streak', v: `${profile.current_streak} day${profile.current_streak === 1 ? '' : 's'}`, accent: true },
            { l: 'Total entries', v: stats ? String(stats.entries) : '—' },
            { l: 'Words written', v: stats ? stats.words.toLocaleString() : '—' },
          ].map((row, i, arr) => (
            <div
              key={row.l}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 16px',
                borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none',
              }}
            >
              <div style={{ fontSize: 14, color: 'var(--ink-2)' }}>{row.l}</div>
              <div
                className="serif"
                style={{ fontSize: 16, fontWeight: 500, color: row.accent ? 'var(--accent)' : 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {row.accent && <Icon.Flame size={14} />}
                {row.v}
              </div>
            </div>
          ))}
        </div>

        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.12em', marginBottom: 8 }}>
          ── SETTINGS
        </div>
        <div style={{ border: '1px solid var(--line-strong)', borderRadius: 4, overflow: 'hidden', background: 'rgba(255,255,255,0.4)' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon.Bell size={16} />
                <div style={{ fontSize: 14 }}>Morning reminder</div>
              </div>
              <button
                onClick={toggleReminder}
                aria-label="Toggle morning reminder"
                style={{
                  width: 40,
                  height: 22,
                  borderRadius: 999,
                  background: profile.reminder_enabled ? 'var(--ink)' : 'var(--paper-3)',
                  position: 'relative',
                  transition: 'background 0.2s',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: profile.reminder_enabled ? 20 : 2,
                    width: 18,
                    height: 18,
                    borderRadius: 999,
                    background: 'var(--paper)',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                />
              </button>
            </div>
            {profile.reminder_enabled && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.08em' }}>EVERY DAY AT</div>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="display"
                  style={{ fontSize: 18, fontWeight: 400, width: 90, textAlign: 'right' }}
                />
              </div>
            )}
          </div>

          <button
            onClick={() => doExport('txt')}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', width: '100%', textAlign: 'left', borderBottom: '1px solid var(--line)' }}
          >
            <div style={{ fontSize: 14, color: 'var(--ink-2)' }}>Export entries as text</div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>{exporting ? '…' : '→'}</div>
          </button>
          <button
            onClick={() => doExport('json')}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', width: '100%', textAlign: 'left', borderBottom: '1px solid var(--line)' }}
          >
            <div style={{ fontSize: 14, color: 'var(--ink-2)' }}>Export entries as JSON</div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>{exporting ? '…' : '→'}</div>
          </button>
          <button
            onClick={signOut}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', width: '100%', textAlign: 'left' }}
          >
            <div style={{ fontSize: 14, color: 'var(--accent)' }}>Sign out</div>
          </button>
        </div>

        <div className="serif" style={{ marginTop: 28, fontStyle: 'italic', fontSize: 13, color: 'var(--ink-3)', textAlign: 'center', lineHeight: 1.5 }}>
          Your words are yours.
          <br />
          Export them any time.
        </div>
      </div>

      <BottomNav active="profile" />
    </div>
  );
}
